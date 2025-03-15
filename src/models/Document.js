import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  botId: {
    type: mongoose.Schema.Types.String,
    required: true,
    index: true // Add index for efficient filtering
  },
  type: {
    type: String,
    enum: ['file', 'website'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
  },
  originalUrl: {
    type: String,
    trim: true,
    // Required only for website type
    validate: {
      validator: function(v) {
        return this.type !== 'website' || (v && v.length > 0);
      },
      message: 'URL is required for website documents'
    }
  },
  fileType: {
    type: String,
    // Required only for file type
    validate: {
      validator: function(v) {
        return this.type !== 'file' || (v && v.length > 0);
      },
      message: 'File type is required for file documents'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending'
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Azure specific fields
  internalLinks: [{
    url: {
      type: String,
      required: true
    },
    text: String,
    isSaved: {
      type: Boolean,
      default: false
    },
    error: String
  }],
  azure: {
    documentId: {
      type: String,
      unique: true
    },
    documentName: {
      type: String
    },
    url: {
      type: String,
    },
    metadata: {
      fileName: String,
      contentType: String,
      size: Number
    },
    lastProcessed: {
      type: Date,
      default: Date.now
    }
  }
});

  // Indexes for better query performance
  documentSchema.index({ userId: 1, createdAt: -1 });
  documentSchema.index({ userId: 1, type: 1 });
  documentSchema.index({ userId: 1, status: 1 }); // For finding pending documents efficiently
  documentSchema.index({ 'azure.documentId': 1 });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

export default Document;
