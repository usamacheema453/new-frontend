// components/chatpage/AttachmentDisplay.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { X, FileText, Image as ImageIcon } from 'lucide-react-native';

export default function AttachmentDisplay({ attachments, onRemove, isMobile }) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (mimeType) => {
    if (mimeType && mimeType.startsWith('image/')) {
      return ImageIcon;
    }
    return FileText;
  };

  const getFileName = (attachment) => {
    if (attachment.fileName) return attachment.fileName;
    if (attachment.name) return attachment.name;
    if (attachment.uri) {
      const uriParts = attachment.uri.split('/');
      return uriParts[uriParts.length - 1];
    }
    return 'Unknown file';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  return (
    <View style={[
      styles.container, 
      isMobile ? styles.mobileContainer : styles.desktopContainer,
      // Web-specific: horizontal layout
      Platform.OS === 'web' && !isMobile && styles.webContainer
    ]}>
      {attachments.map((attachment, index) => {
        const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');
        const IconComponent = getFileIcon(attachment.mimeType);
        
        return (
          <View 
            key={`${attachment.uri}-${index}`} 
            style={[
              styles.attachmentItem,
              isMobile ? styles.mobileAttachmentItem : styles.desktopAttachmentItem,
              // Web-specific: constrain width for horizontal layout
              Platform.OS === 'web' && !isMobile && styles.webAttachmentItem
            ]}
          >
            {isImage ? (
              <Image 
                source={{ uri: attachment.uri }} 
                style={[
                  styles.attachmentImage,
                  isMobile ? styles.mobileAttachmentImage : styles.desktopAttachmentImage
                ]}
                resizeMode="cover"
              />
            ) : (
              <View style={[
                styles.fileIconContainer,
                isMobile ? styles.mobileFileIconContainer : styles.desktopFileIconContainer
              ]}>
                <IconComponent 
                  size={isMobile ? 20 : 24} 
                  color="#6B7280" 
                />
              </View>
            )}
            
            <View style={styles.attachmentInfo}>
              <Text 
                style={[
                  styles.fileName,
                  isMobile ? styles.mobileFileName : styles.desktopFileName,
                  // Web-specific: ensure text doesn't overflow in constrained width
                  Platform.OS === 'web' && !isMobile && styles.webFileName
                ]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {getFileName(attachment)}
              </Text>
              {attachment.size && (
                <Text style={[
                  styles.fileSize,
                  isMobile ? styles.mobileFileSize : styles.desktopFileSize
                ]}>
                  {formatFileSize(attachment.size)}
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.removeButton,
                isMobile ? styles.mobileRemoveButton : styles.desktopRemoveButton
              ]}
              onPress={() => onRemove(index)}
              activeOpacity={0.7}
            >
              <X size={isMobile ? 16 : 18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  
  mobileContainer: {
    paddingHorizontal: 4,
  },
  
  desktopContainer: {
    paddingHorizontal: 0,
  },
  
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  mobileAttachmentItem: {
    padding: 8,
    minHeight: 50,
  },
  
  desktopAttachmentItem: {
    padding: 10,
    minHeight: 56,
  },
  
  attachmentImage: {
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  
  mobileAttachmentImage: {
    width: 36,
    height: 36,
  },
  
  desktopAttachmentImage: {
    width: 40,
    height: 40,
  },
  
  fileIconContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  mobileFileIconContainer: {
    width: 36,
    height: 36,
  },
  
  desktopFileIconContainer: {
    width: 40,
    height: 40,
  },
  
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  
  fileName: {
    fontWeight: '500',
    color: '#374151',
  },
  
  mobileFileName: {
    fontSize: 14,
    lineHeight: 18,
  },
  
  desktopFileName: {
    fontSize: 15,
    lineHeight: 20,
  },
  
  fileSize: {
    color: '#6B7280',
    marginTop: 2,
  },
  
  mobileFileSize: {
    fontSize: 12,
    lineHeight: 16,
  },
  
  desktopFileSize: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  removeButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        },
      },
    }),
  },
  
  mobileRemoveButton: {
    width: 28,
    height: 28,
  },
  
  desktopRemoveButton: {
    width: 32,
    height: 32,
  },
  
  // Web-specific styles for horizontal layout
  webContainer: {
    ...Platform.select({
      web: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // Space between attachments
        marginBottom: 12, // Slightly more margin for web
      },
    }),
  },
  
  webAttachmentItem: {
    ...Platform.select({
      web: {
        width: 'calc(25% - 6px)', // 25% width minus gap compensation
        minWidth: 180, // Minimum width to ensure readability
        maxWidth: 220, // Maximum width to prevent overly wide items
        marginBottom: 0, // Remove individual margins since we use gap
      },
    }),
  },
  
  webFileName: {
    ...Platform.select({
      web: {
        fontSize: 14, // Slightly smaller for web to fit better
        lineHeight: 18,
      },
    }),
  },
});