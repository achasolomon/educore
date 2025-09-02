// backend/src/modules/attendance/services/qrCodeService.js
const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../../../core/utils/logger');

class QRCodeService {
  static async generateSessionQR(sessionId, schoolId) {
    try {
      const token = crypto.randomUUID();
      const timestamp = Date.now();
      
      const qrData = {
        token,
        sessionId,
        schoolId,
        timestamp,
        type: 'attendance_session'
      };

      const qrString = JSON.stringify(qrData);
      const qrImage = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#FF6B35', // Orange theme
          light: '#FFFFFF'
        },
        width: 256
      });

      logger.info(`QR code generated for session ${sessionId}`);

      return {
        qrImage,
        token,
        sessionId,
        expiresAt: new Date(timestamp + (15 * 60 * 1000)), // 15 minutes
        rawData: qrString
      };

    } catch (error) {
      logger.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static async verifyQRCode(qrString, schoolId) {
    try {
      let qrData;
      try {
        qrData = JSON.parse(qrString);
      } catch (parseError) {
        logger.warn('Invalid QR code format');
        return null;
      }

      if (!qrData.token || !qrData.schoolId || !qrData.timestamp) {
        logger.warn('Missing required QR data fields');
        return null;
      }

      if (qrData.schoolId !== schoolId) {
        logger.warn('School ID mismatch in QR code');
        return null;
      }

      // Check if QR code is expired (15 minutes)
      const now = Date.now();
      if (now - qrData.timestamp > (15 * 60 * 1000)) {
        logger.warn('QR code expired');
        return null;
      }

      logger.info('QR code verified successfully');
      return qrData;

    } catch (error) {
      logger.error('QR code verification error:', error);
      return null;
    }
  }
}

module.exports = QRCodeService;