import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';

// Extract internal links from a webpage
export async function extractInternalLinks(url, html) {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);
  const links = new Map(); // Use Map to deduplicate URLs

  $('a').each((_, element) => {
    const $element = $(element);
    let href = $element.attr('href');
    let linkText = $element.text().trim();

    // Skip if no href or it's a hash link
    if (!href || href.startsWith('#')) return;

    try {
      // Handle relative URLs
      const absoluteUrl = new URL(href, url);

      // Only include links from same domain
      if (absoluteUrl.hostname === baseUrl.hostname) {
        // Use href as key to deduplicate
        links.set(absoluteUrl.href, {
          url: absoluteUrl.href,
          text: linkText || absoluteUrl.pathname
        });
      }
    } catch (error) {
      console.error('Invalid URL:', href);
    }
  });

  // Convert Map values to array
  return Array.from(links.values());
}

// Extract text from PDF files
export async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Extract text from DOC/DOCX files
export async function extractDocText(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOC extraction error:', error);
    throw new Error('Failed to extract text from document');
  }
}

// Extract text from TXT files
export function extractTxtText(buffer) {
  return buffer.toString('utf-8');
}

// Scrape and extract text from websites
export async function scrapeWebsite(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extract internal links
      const internalLinks = await extractInternalLinks(url, response.data);

      // Remove script and style elements
    $('script').remove();
    $('style').remove();
    $('noscript').remove();

    // Extract text from main content areas
    const textContent = [];
    
    // Common content selectors
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main',
    ];

    // Try to find main content first
    let mainContent = $(contentSelectors.join(','));
    
    // If no main content found, fall back to body
    if (mainContent.length === 0) {
      mainContent = $('body');
    }

    // Extract text from paragraphs and headings
    mainContent.find('h1, h2, h3, h4, h5, h6, p').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        textContent.push(text);
      }
    });

    return {
      text: textContent.join('\n\n'),
      internalLinks
    };
  } catch (error) {
    console.error('Web scraping error:', error);
    throw new Error('Failed to scrape website');
  }
}

// Process file based on type
export async function processFile(buffer, fileType) {
  switch (fileType.toLowerCase()) {
    case '.pdf':
      return await extractPdfText(buffer);
    case '.doc':
    case '.docx':
      return await extractDocText(buffer);
    case '.txt':
      return extractTxtText(buffer);
    default:
      throw new Error('Unsupported file type');
  }
}

// Clean and normalize text content
export function normalizeContent(text) {
  return text
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}
