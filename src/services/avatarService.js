// src/services/avatarService.js

/**
 * Avatar Management Service for EasyNest
 * Handles avatar upload, management, and deletion with Cloudinary integration
 */

class AvatarService {
    constructor() {
        this.CLOUDINARY_CLOUD_NAME = 'dr0nc9xqj';
        this.CLOUDINARY_UPLOAD_PRESET = 'easynest_preset';
        this.CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`;
        this.MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        this.ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    }

    /**
     * Validate image file
     * @param {File} file - File to validate
     * @returns {Object} - Validation result
     */
    validateImageFile(file) {
        const errors = [];

        // Check file type
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            errors.push('Please upload a valid image file (JPEG, PNG, WebP, or SVG)');
        }

        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            errors.push('File size must be less than 5MB');
        }

        // Check file dimensions
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const { width, height } = img;
                if (width < 100 || height < 100) {
                    errors.push('Image must be at least 100x100 pixels');
                }
                if (width > 2000 || height > 2000) {
                    errors.push('Image must be less than 2000x2000 pixels');
                }
                resolve({ isValid: errors.length === 0, errors });
            };
            img.onerror = () => {
                errors.push('Invalid image file');
                resolve({ isValid: false, errors });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Upload avatar to Cloudinary
     * @param {File} file - Image file to upload
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} - Upload result
     */
    async uploadAvatar(file, options = {}) {
        const validation = await this.validateImageFile(file);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);

        // Add folder structure
        if (options.folder) {
            formData.append('folder', options.folder);
        }

        // Add transformation options
        if (options.transformation) {
            formData.append('transformation', JSON.stringify(options.transformation));
        }

        // Add tags for organization
        if (options.tags) {
            formData.append('tags', options.tags.join(','));
        }

        try {
            const response = await fetch(this.CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                url: data.secure_url,
                public_id: data.public_id,
                width: data.width,
                height: data.height,
                format: data.format,
                bytes: data.bytes,
                resource_type: data.resource_type
            };
        } catch (error) {
            console.error('Avatar upload error:', error);
            throw new Error(`Failed to upload avatar: ${error.message}`);
        }
    }

    /**
     * Delete avatar from Cloudinary
     * @param {string} publicId - Public ID of the image to delete
     * @returns {Promise<boolean>} - Deletion result
     */
    async deleteAvatar(publicId) {
        try {
            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('invalidate', 'true');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.result === 'ok';
        } catch (error) {
            console.error('Avatar delete error:', error);
            throw new Error(`Failed to delete avatar: ${error.message}`);
        }
    }

    /**
     * Get avatar transformation options for different use cases
     * @param {string} type - Type of avatar (profile, thumbnail, etc.)
     * @returns {Object} - Transformation options
     */
    getTransformationOptions(type = 'profile') {
        const transformations = {
            profile: {
                crop: 'thumb',
                gravity: 'face',
                width: 200,
                height: 200,
                quality: 'auto:good',
                fetch_format: 'auto',
                format: 'webp'
            },
            thumbnail: {
                crop: 'fill',
                gravity: 'face',
                width: 100,
                height: 100,
                quality: 'auto:good',
                fetch_format: 'auto',
                format: 'webp'
            },
            banner: {
                crop: 'fill',
                gravity: 'center',
                width: 1200,
                height: 400,
                quality: 'auto:good',
                fetch_format: 'auto',
                format: 'webp'
            },
            large: {
                crop: 'limit',
                width: 800,
                height: 800,
                quality: 'auto:excellent',
                fetch_format: 'auto',
                format: 'webp'
            }
        };

        return transformations[type] || transformations.profile;
    }

    /**
     * Generate unique filename for avatar
     * @param {string} userId - User ID
     * @param {string} originalName - Original filename
     * @returns {string} - Generated filename
     */
    generateFilename(userId, originalName) {
        const timestamp = Date.now();
        const fileExtension = originalName.split('.').pop();
        return `avatar_${userId}_${timestamp}.${fileExtension}`;
    }

    /**
     * Get optimized avatar URL based on device and use case
     * @param {string} avatarUrl - Original avatar URL
     * @param {string} size - Size needed ('thumbnail', 'medium', 'large')
     * @returns {string} - Optimized URL
     */
    getOptimizedAvatarUrl(avatarUrl, size = 'medium') {
        if (!avatarUrl) return null;

        const transformations = this.getTransformationOptions(size);
        const publicId = avatarUrl.split('/').pop().split('.')[0];

        // Generate optimized URL
        const optimizedUrl = avatarUrl.replace(
            `/upload/`,
            `/w_${transformations.width},h_${transformations.height},c_fit,q_${transformations.quality}/${publicId}.${transformations.format}`
        );

        return optimizedUrl;
    }

    /**
     * Compress image client-side before upload
     * @param {File} file - Original file
     * @param {Object} options - Compression options
     * @returns {Promise<File>} - Compressed file
     */
    async compressImage(file, options = {}) {
        const quality = options.quality || 0.8;
        const maxWidth = options.maxWidth || 2000;
        const maxHeight = options.maxHeight || 2000;

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/webp',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, `image/webp`, quality);
            };

            img.onerror = () => {
                resolve(file); // Return original if compression fails
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Process image before upload (compression, optimization)
     * @param {File} file - Original file
     * @param {Object} options - Processing options
     * @returns {Promise<File>} - Processed file
     */
    async processImageForUpload(file, options = {}) {
        const { compress = true, quality = 0.8, maxWidth = 2000, maxHeight = 2000 } = options;

        if (compress && file.size > 1024 * 1024) { // Only compress if larger than 1MB
            try {
                const compressedFile = await this.compressImage(file, { quality, maxWidth, maxHeight });
                return compressedFile;
            } catch (error) {
                console.warn('Image compression failed, using original file:', error);
            }
        }

        return file;
    }

    /**
     * Create avatar preview data
     * @param {File} file - Image file
     * @returns {Promise<Object>} - Preview data
     */
    async createAvatarPreview(file) {
        const processedFile = await this.processImageForUpload(file);

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    file: processedFile,
                    preview: e.target.result,
                    name: file.name,
                    size: processedFile.size,
                    type: processedFile.type
                });
            };
            reader.readAsDataURL(processedFile);
        });
    }

    /**
     * Validate avatar dimensions for different use cases
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {string} useCase - Use case for the avatar
     * @returns {Object} - Validation result
     */
    validateAvatarDimensions(width, height, useCase = 'profile') {
        const requirements = {
            profile: { min: 100, max: 2000, aspectRatio: 1.0 },
            thumbnail: { min: 64, max: 200, aspectRatio: 1.0 },
            banner: { min: 400, max: 1200, aspectRatio: 3.0 },
        };

        const req = requirements[useCase] || requirements.profile;
        const aspectRatio = width / height;

        const isValid = width >= req.min && width <= req.max &&
                         height >= req.min && height <= req.max &&
                         Math.abs(aspectRatio - req.aspectRatio) <= 0.2;

        return {
            isValid,
            width,
            height,
            aspectRatio,
            requirements: req,
            message: isValid ? 'Valid dimensions' : `Image dimensions must be ${req.min}x${req.min} to ${req.max} with aspect ratio close to ${req.aspectRatio}`
        };
    }

    /**
     * Check if avatar is from Cloudinary
     * @param {string} url - Avatar URL
     * @returns {boolean} - Whether it's a Cloudinary URL
     */
    isCloudinaryUrl(url) {
        return url && url.includes(`${this.CLOUDINARY_CLOUD_NAME}/image/upload`);
    }

    /**
     * Extract public_id from Cloudinary URL
     * @param {string} url - Cloudinary URL
     * @returns {string|null} - Public ID or null if not found
     */
    extractPublicIdFromUrl(url) {
        if (!this.isCloudinaryUrl(url)) return null;

        try {
            const urlParts = url.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            return publicId;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get image metadata from URL
     * @param {string} url - Image URL
     * @returns {Promise<Object>} - Image metadata
     */
    async getImageMetadata(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.width / img.height,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                });
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    /**
     * Crop image to square format
     * @param {File} file - Image file to crop
     * @param {Object} options - Cropping options
     * @returns {Promise<File>} - Cropped image file
     */
    async cropToSquare(file, options = {}) {
        const { size = 200, quality = 0.8 } = options;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const { width, height } = img;
                    const cropSize = Math.min(width, height, size);
                    const cropX = (width - cropSize) / 2;
                    const cropY = (height - cropSize) / 2;

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = cropSize;
                    canvas.height = cropSize;

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, cropX, cropY, cropSize, cropSize);

                    canvas.toBlob((blob) => {
                        const croppedFile = new File([blob], file.name, {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(croppedFile);
                    }, `image/webp`, quality);
                };
                img.onerror = () => {
                    resolve(file); // Return original if cropping fails
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Add watermark to avatar
     * @param {File} file - Image file
     * @param {Object} options - Watermark options
     * @returns {Promise<File>} - Watermarked image file
     */
    async addWatermark(file, options = {}) {
        const { text = 'EasyNest', opacity = 0.1, position = 'bottom-right' } = options;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const { width, height } = img;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = width;
                    canvas.height = height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0, width, height);

                    // Add watermark
                    ctx.font = `${Math.max(width, height) / 20}px Arial`;
                    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
                    ctx.textAlign = position.includes('right') ? 'right' : 'left';
                    ctx.textBaseline = position.includes('bottom') ? 'bottom' : 'top';

                    const x = position.includes('right') ? width - 10 : 10;
                    const y = position.includes('bottom') ? height - 10 : 20;

                    ctx.fillText(text, x, y);

                    canvas.toBlob((blob) => {
                        const watermarkedFile = new File([blob], file.name, {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(watermarkedFile);
                    }, `image/webp`);
                };
                img.onerror = () => {
                    resolve(file); // Return original if watermarking fails
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
}

// Export singleton instance
export const avatarService = new AvatarService();

export default avatarService;