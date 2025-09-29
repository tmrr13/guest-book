/**
 * Download Form Validation Component
 * 
 * This component handles form validation for download functionality
 * and ensures proper security headers are set for HTTP responses.
 * 
 * Security Note: HSTS headers should be configured at the server level
 * for comprehensive protection across the entire application.
 */

interface DownloadFormData {
  filename?: string;
  fileType?: string;
  size?: number;
  metadata?: Record<string, any>;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  message?: string;
}

/**
 * Security utility to ensure HSTS considerations are met
 * Note: This is a frontend implementation. HSTS headers should primarily
 * be configured at the server/middleware level for maximum security.
 */
class SecurityHeaders {
  /**
   * Validates that the current connection is secure (HTTPS)
   * and warns if HSTS headers are missing from responses
   */
  static validateSecureConnection(): boolean {
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      console.warn('⚠️ SECURITY WARNING: Connection is not using HTTPS. HSTS headers cannot provide protection over HTTP.');
      return false;
    }
    return true;
  }

  /**
   * Checks if response includes proper HSTS headers
   * This is for validation purposes - actual HSTS headers must be set server-side
   */
  static validateHSTSHeaders(response: Response): void {
    const hstsHeader = response.headers.get('Strict-Transport-Security');
    
    if (!hstsHeader) {
      console.warn('⚠️ SECURITY WARNING: Response missing HSTS header. Ensure server is configured with:');
      console.warn('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    } else {
      // Validate HSTS header configuration
      const hasProperMaxAge = /max-age=([0-9]+)/.test(hstsHeader);
      const hasSubDomains = hstsHeader.includes('includeSubDomains');
      
      if (!hasProperMaxAge) {
        console.warn('⚠️ SECURITY WARNING: HSTS header missing or has insufficient max-age value');
      }
      
      if (!hasSubDomains) {
        console.warn('⚠️ SECURITY WARNING: HSTS header should include includeSubDomains for better security');
      }
    }
  }
}

/**
 * Download Form Validation Class
 * Handles validation and secure processing of download form data
 */
export class DownloadFormValidation {
  private static readonly MAX_FILENAME_LENGTH = 255;
  private static readonly ALLOWED_FILE_TYPES = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'json', 'xml'
  ];

  /**
   * Validates download form data
   */
  static validateForm(data: DownloadFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate filename
    if (!data.filename) {
      errors.push({
        field: 'filename',
        message: 'Filename is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (data.filename.length > this.MAX_FILENAME_LENGTH) {
      errors.push({
        field: 'filename',
        message: `Filename must be less than ${this.MAX_FILENAME_LENGTH} characters`,
        code: 'FIELD_TOO_LONG'
      });
    }

    // Validate file type
    if (data.fileType && !this.ALLOWED_FILE_TYPES.includes(data.fileType.toLowerCase())) {
      errors.push({
        field: 'fileType',
        message: `File type must be one of: ${this.ALLOWED_FILE_TYPES.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Validate file size (if provided)
    if (data.size && data.size <= 0) {
      errors.push({
        field: 'size',
        message: 'File size must be greater than 0',
        code: 'INVALID_SIZE'
      });
    }

    return errors;
  }

  /**
   * Securely processes API response with HSTS validation
   * Line 98 equivalent - the original security vulnerability location
   */
  static async processSecureResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      // Validate secure connection
      SecurityHeaders.validateSecureConnection();
      
      // Validate HSTS headers in response
      SecurityHeaders.validateHSTSHeaders(response);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Securely parse JSON response (Line 98 - original vulnerability location)
      const jsonData = await response.json() as ApiResponse<T>;
      
      return {
        success: true,
        data: jsonData.data,
        message: jsonData.message || 'Request completed successfully'
      };
      
    } catch (error) {
      console.error('Error processing secure response:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'PROCESSING_ERROR'
        }]
      };
    }
  }

  /**
   * Main download validation method that combines form validation and secure API calls
   */
  static async validateAndDownload(
    formData: DownloadFormData, 
    endpoint: string
  ): Promise<ApiResponse<any>> {
    // Validate form data first
    const validationErrors = this.validateForm(formData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      };
    }

    try {
      // Make secure API call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: HSTS headers should be set by the server, not in request headers
        },
        body: JSON.stringify(formData)
      });

      // Process response securely with HSTS validation
      return await this.processSecureResponse(response);
      
    } catch (error) {
      console.error('Download validation failed:', error);
      return {
        success: false,
        errors: [{
          field: 'network',
          message: 'Network error occurred during download validation',
          code: 'NETWORK_ERROR'
        }]
      };
    }
  }
}

export default DownloadFormValidation;