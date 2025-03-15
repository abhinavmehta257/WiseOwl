const { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol } = require('@azure/storage-blob');
const { AZURE_CONFIG } = require('./config');

class AzureStorageService {
  constructor() {
    try {
      if (!AZURE_CONFIG.storage?.accessKey) {
        throw new Error('Missing required Azure Storage configuration');
      }

      // Create StorageSharedKeyCredential and store it for reuse
      this.sharedKeyCredential = new StorageSharedKeyCredential(
        AZURE_CONFIG.storage.accountName,
        AZURE_CONFIG.storage.accessKey
      );
      
      // Create BlobServiceClient
      const blobServiceUrl = `https://${AZURE_CONFIG.storage.accountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(
        blobServiceUrl,
        this.sharedKeyCredential,
        {
          retryOptions: { maxTries: 3 },
          keepAliveOptions: { enable: true }
        }
      );

      this.containerClient = this.blobServiceClient.getContainerClient(
        AZURE_CONFIG.storage.containerName
      );

      console.log('Azure Storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure Storage service:', error);
      throw new Error(`Azure Storage initialization failed: ${error.message}`);
    }
  }

  async initialize() {
    try {
      console.log(`Initializing storage container "${AZURE_CONFIG.storage.containerName}"...`);
      // const response = await this.containerClient.createIfNotExists({
      //   access: 'blob'
      // });

      // if (response.succeeded) {
      //   console.log('Storage container created successfully');
      // } else {
      //   console.log('Storage container already exists');
      // }

      // Test container access
      const exists = await this.containerClient.exists();
      if (!exists) {
        throw new Error('Failed to verify container access');
      }

      console.log('Container access verified successfully');
    } catch (error) {
      console.error('Failed to initialize storage container:', error);
      throw new Error(`Storage initialization failed: ${error.message}`);
    }
  }

  async generateBlobSasToken(blobName, permissionString) {
    try {
      console.log(`Generating SAS token for blob "${blobName}"...`);
      
      const blobClient = this.containerClient.getBlobClient(blobName);
      
      const startsOn = new Date();
      const expiresOn = new Date(startsOn);
      expiresOn.setHours(startsOn.getHours() + 1); // 1-hour token

      const sasOptions = {
        containerName: AZURE_CONFIG.storage.containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse(permissionString),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https
      };

      // Generate SAS token using the stored credentials
      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        this.sharedKeyCredential
      ).toString();

      console.log('SAS token generated successfully');
      return sasToken;
    } catch (error) {
      console.error('Failed to generate SAS token:', error);
      throw new Error(`SAS token generation failed: ${error.message}`);
    }
  }

  async uploadDocument(file, userId) {
    try {
      if (!file || !userId) {
        throw new Error('Missing required parameters: file or userId');
      }

      // Generate unique blob name
      const blobName = `${userId}/${Date.now()}-${file.name}`;
      console.log(`Uploading file "${file.name}" as "${blobName}"...`);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload file with metadata
      await blockBlobClient.uploadData(await file.arrayBuffer(), {
        blobHTTPHeaders: {
          blobContentType: file.type
        },
        metadata: {
          uploadedBy: userId,
          originalName: file.name,
          uploadTimestamp: new Date().toISOString()
        }
      });

      console.log('File upload successful, generating SAS token...');

      // Generate SAS token with read permission
      const sasToken = await this.generateBlobSasToken(blobName, 'r');
      const blobUrl = blockBlobClient.url + '?' + sasToken;

      console.log('Document upload completed successfully');
      return {
        url: blobUrl,
        blobName,
        contentType: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Failed to upload document:', {
        error: error.message,
        fileName: file?.name,
        userId
      });
      throw new Error(`Document upload failed: ${error.message}`);
    }
  }

  async deleteDocument(blobName) {
    try {
      console.log(`Deleting blob "${blobName}"...`);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Check if blob exists before attempting deletion
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error('Blob not found');
      }

      await blockBlobClient.delete();
      console.log('Blob deleted successfully');
    } catch (error) {
      console.error('Failed to delete blob:', {
        error: error.message,
        blobName
      });
      throw new Error(`Document deletion failed: ${error.message}`);
    }
  }

  async generateSasUrl(blobName) {
    try {
      console.log(`Generating SAS URL for blob "${blobName}"...`);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Verify blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error('Blob not found');
      }

      const sasToken = await this.generateBlobSasToken(blobName, 'r');
      const url = blockBlobClient.url + '?' + sasToken;

      console.log('SAS URL generated successfully');
      return url;
    } catch (error) {
      console.error('Failed to generate SAS URL:', {
        error: error.message,
        blobName
      });
      throw new Error(`SAS URL generation failed: ${error.message}`);
    }
  }
}

module.exports = { AzureStorageService };
