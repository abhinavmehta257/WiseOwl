import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import DocumentUpload from "../components/bot/DocumentUpload";
import WebsiteUrlInput from "../components/bot/WebsiteUrlInput";
import DocumentList from "../components/bot/DocumentList";

export default function TestDocuments() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Documents</h1>
        
        <div className="space-y-6">
          {/* File Upload */}
          <DocumentUpload />
          
          {/* Website URL Input */}
          <WebsiteUrlInput />
          
          {/* Document List */}
          <DocumentList />
        </div>
      </div>
    </div>
  );
}

// Protect the page with authentication
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {}
  };
}
