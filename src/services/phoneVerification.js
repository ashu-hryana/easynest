// src/services/phoneVerification.js

/**
 * Phone Verification Service for EasyNest
 * Handles OTP generation, validation, and phone number verification
 */

// Mock OTP service - in production, integrate with actual SMS service like Twilio, Firebase Phone Auth, etc.
export class PhoneVerificationService {
    constructor() {
        this.mockOTPs = new Map(); // For demo purposes only
        this.verificationAttempts = new Map();
    }

    /**
     * Generate a 6-digit OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP to phone number
     * @param {string} phoneNumber - Phone number in E.164 format
     * @param {string} countryCode - Country code (e.g., '+91', '+1')
     * @returns {Promise<string>} - Returns the session ID
     */
    async sendOTP(phoneNumber, countryCode) {
        try {
            const fullPhoneNumber = phoneNumber.startsWith('+')
                ? phoneNumber
                : `${countryCode}${phoneNumber}`;

            // Validate phone number format
            if (!this.validatePhoneNumber(fullPhoneNumber)) {
                throw new Error('Invalid phone number format');
            }

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const otp = this.generateOTP();

            // Store OTP for demo (in production, this would be handled by SMS service)
            this.mockOTPs.set(sessionId, {
                otp,
                phoneNumber: fullPhoneNumber,
                attempts: 0,
                timestamp: Date.now(),
                verified: false
            });

            // Simulate sending SMS (in production, use actual SMS service)
            console.log(`SMS sent to ${fullPhoneNumber}: Your EasyNest verification code is ${otp}`);

            // Mock SMS sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                sessionId,
                message: `OTP sent to ${fullPhoneNumber}`
            };

        } catch (error) {
            console.error('Error sending OTP:', error);
            throw error;
        }
    }

    /**
     * Verify OTP
     * @param {string} sessionId - Session ID from sendOTP
     * @param {string} otp - User entered OTP
     * @returns {Promise<boolean>} - Returns verification result
     */
    async verifyOTP(sessionId, otp) {
        try {
            const sessionData = this.mockOTPs.get(sessionId);

            if (!sessionData) {
                throw new Error('Invalid or expired session');
            }

            // Check if OTP is expired (10 minutes)
            if (Date.now() - sessionData.timestamp > 10 * 60 * 1000) {
                this.mockOTPs.delete(sessionId);
                throw new Error('OTP has expired. Please request a new one.');
            }

            // Check attempts limit (max 3 attempts)
            if (sessionData.attempts >= 3) {
                this.mockOTPs.delete(sessionId);
                throw new Error('Too many failed attempts. Please request a new OTP.');
            }

            sessionData.attempts++;

            if (sessionData.otp === otp) {
                sessionData.verified = true;
                return {
                    success: true,
                    phoneNumber: sessionData.phoneNumber
                };
            } else {
                return {
                    success: false,
                    message: `Invalid OTP. ${3 - sessionData.attempts} attempts remaining.`
                };
            }

        } catch (error) {
            console.error('Error verifying OTP:', error);
            throw error;
        }
    }

    /**
     * Resend OTP
     * @param {string} sessionId - Previous session ID
     * @returns {Promise<string>} - Returns new session ID
     */
    async resendOTP(sessionId) {
        try {
            const sessionData = this.mockOTPs.get(sessionId);

            if (!sessionData) {
                throw new Error('Invalid session');
            }

            // Check if enough time has passed since last OTP (30 seconds)
            const timeSinceLastOTP = Date.now() - sessionData.timestamp;
            if (timeSinceLastOTP < 30 * 1000) {
                const remainingTime = Math.ceil((30 * 1000 - timeSinceLastOTP) / 1000);
                throw new Error(`Please wait ${remainingTime} seconds before requesting a new OTP.`);
            }

            // Delete old session and create new one
            this.mockOTPs.delete(sessionId);
            return await this.sendOTP(sessionData.phoneNumber, '');

        } catch (error) {
            console.error('Error resending OTP:', error);
            throw error;
        }
    }

    /**
     * Validate phone number format
     * @param {string} phoneNumber - Phone number to validate
     * @returns {boolean} - Returns validation result
     */
    validatePhoneNumber(phoneNumber) {
        // Basic validation for phone numbers
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }

    /**
     * Format phone number for display
     * @param {string} phoneNumber - Phone number
     * @param {string} countryCode - Country code
     * @returns {string} - Formatted phone number
     */
    formatPhoneNumber(phoneNumber, countryCode) {
        const fullNumber = phoneNumber.startsWith('+')
            ? phoneNumber
            : `${countryCode}${phoneNumber}`;

        // Format for Indian numbers
        if (fullNumber.startsWith('+91') && fullNumber.length === 13) {
            const number = fullNumber.slice(3);
            return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
        }

        // Format for US numbers
        if (fullNumber.startsWith('+1') && fullNumber.length === 12) {
            const number = fullNumber.slice(2);
            return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
        }

        return fullNumber;
    }

    /**
     * Get country list with codes
     * @returns {Array} - Array of countries
     */
    getCountryList() {
        return [
            { code: '+91', name: 'India', flag: '🇮🇳' },
            { code: '+1', name: 'United States', flag: '🇺🇸' },
            { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
            { code: '+61', name: 'Australia', flag: '🇦🇺' },
            { code: '+81', name: 'Japan', flag: '🇯🇵' },
            { code: '+86', name: 'China', flag: '🇨🇳' },
            { code: '+49', name: 'Germany', flag: '🇩🇪' },
            { code: '+33', name: 'France', flag: '🇫🇷' },
            { code: '+39', name: 'Italy', flag: '🇮🇹' },
            { code: '+34', name: 'Spain', flag: '🇪🇸' },
            { code: '+971', name: 'UAE', flag: '🇦🇪' },
            { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
            { code: '+65', name: 'Singapore', flag: '🇸🇬' },
            { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
            { code: '+66', name: 'Thailand', flag: '🇹🇭' },
            { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
            { code: '+63', name: 'Philippines', flag: '🇵🇭' },
            { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
            { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
            { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
            { code: '+977', name: 'Nepal', flag: '🇳🇵' }
        ];
    }

    /**
     * Get nationalities list
     * @returns {Array} - Array of nationalities
     */
    getNationalities() {
        return [
            { code: 'IN', name: 'Indian', flag: '🇮🇳' },
            { code: 'US', name: 'American', flag: '🇺🇸' },
            { code: 'GB', name: 'British', flag: '🇬🇧' },
            { code: 'AU', name: 'Australian', flag: '🇦🇺' },
            { code: 'CA', name: 'Canadian', flag: '🇨🇦' },
            { code: 'JP', name: 'Japanese', flag: '🇯🇵' },
            { code: 'CN', name: 'Chinese', flag: '🇨🇳' },
            { code: 'DE', name: 'German', flag: '🇩🇪' },
            { code: 'FR', name: 'French', flag: '🇫🇷' },
            { code: 'IT', name: 'Italian', flag: '🇮🇹' },
            { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
            { code: 'AE', name: 'Emirati', flag: '🇦🇪' },
            { code: 'SA', name: 'Saudi', flag: '🇸🇦' },
            { code: 'SG', name: 'Singaporean', flag: '🇸🇬' },
            { code: 'MY', name: 'Malaysian', flag: '🇲🇾' },
            { code: 'TH', name: 'Thai', flag: '🇹🇭' },
            { code: 'ID', name: 'Indonesian', flag: '🇮🇩' },
            { code: 'PH', name: 'Filipino', flag: '🇵🇭' },
            { code: 'PK', name: 'Pakistani', flag: '🇵🇰' },
            { code: 'BD', name: 'Bangladeshi', flag: '🇧🇩' },
            { code: 'LK', name: 'Sri Lankan', flag: '🇱🇰' },
            { code: 'NP', name: 'Nepalese', flag: '🇳🇵' },
            { code: 'KR', name: 'Korean', flag: '🇰🇷' },
            { code: 'RU', name: 'Russian', flag: '🇷🇺' },
            { code: 'BR', name: 'Brazilian', flag: '🇧🇷' },
            { code: 'MX', name: 'Mexican', flag: '🇲🇽' },
            { code: 'ZA', name: 'South African', flag: '🇿🇦' },
            { code: 'NG', name: 'Nigerian', flag: '🇳🇬' },
            { code: 'EG', name: 'Egyptian', flag: '🇪🇬' },
            { code: 'KE', name: 'Kenyan', flag: '🇰🇪' }
        ];
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, sessionData] of this.mockOTPs.entries()) {
            if (now - sessionData.timestamp > 10 * 60 * 1000) { // 10 minutes
                this.mockOTPs.delete(sessionId);
            }
        }
    }
}

// Export singleton instance
export const phoneVerificationService = new PhoneVerificationService();

// Auto-cleanup expired sessions every 5 minutes
setInterval(() => {
    phoneVerificationService.cleanupExpiredSessions();
}, 5 * 60 * 1000);

export default phoneVerificationService;