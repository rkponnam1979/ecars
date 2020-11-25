const sdk = require('@salesforce/salesforce-sdk');
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const sgMail = require('@sendgrid/mail');

// QR Code formatting options
const options = {
    color: {
        dark: '#1A4A83', // Pulsar Blue
        light: '#0000' // Transparent background
    }
};

// Custom Error Handlers
class GenerateQRCodeError extends Error {
    constructor(...args) {
        super(...args);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, GenerateQRCodeError);
    }
}

class UploadImageError extends Error {
    constructor(...args) {
        super(...args);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, UploadImageError);
    }
}

class SendEmailError extends Error {
    constructor(...args) {
        super(...args);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, SendEmailError);
    }
}

// Function Body
module.exports = async function (event, context, logger) {
    // Get Secrets from the function context
    const { cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret, sendgrid_key } = Object.fromEntries(context.secrets.get(
        'secrets'
    ));

    // Assign the properties from the invocation payload
    const { id, url, toAddress, carImage, firstName } = event.data;

    let qrCodeUrl = null;
    try {
        // Generate the QR Code as String
        const qrCode = await generateQR(url);
        // Upload the image to cloudinary
        qrCodeUrl = await uploadImage({ qrCode, id, cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret });
        // Send email to the contact
        await sendEmail({ qrCodeUrl, toAddress, carImage, firstName, sendgrid_key });
    } catch (err) {
        if (err instanceof GenerateQRCodeError) {
            return { error: 'Failed to generate a QR code', stack: err.stack };
        } else if (err instanceof UploadImageError) {
            return { error: 'Failed to upload an image', stack: err.stack };
        } else if (err instanceof SendEmailError) {
            return { error: 'Failed to send an email', stack: err.stack };
        } else {
            return { error: err.message, stack: err.stack }
        }
    }
    // Return the qrcode image url
    return url;
};

// Generate the QR Code using the QRCode Module
async function generateQR(text) {
    try {
        return QRCode.toDataURL(text, options);
    } catch (err) {
        throw new GenerateQRCodeError(err.message);
    }
}

// Upload the QR Code to an image hosting service
async function uploadImage({ qrCode, id, cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret }) {
    //Set cloudinary secrets
    cloudinary.config({
        cloud_name: cloudinary_cloud_name,
        api_key: cloudinary_api_key,
        api_secret: cloudinary_api_secret
    });
    // Generate a promise and upload the QR Code
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(qrCode, { public_id: id }, (err, image) => {
            if (err) {
                reject(new UploadImageError(err.message));
                return;
            }
            resolve(image.url);
        });
    });
}

// Send a personalized email to the contact
async function sendEmail({ qrCodeUrl, toAddress, carImage, firstName, sendgrid_key }) {
    // Add the api key
    sgMail.setApiKey(sendgrid_key);
    // Format the email
    const msg = {
        to: toAddress,
        from: {
            email: 'stephanwgarcia@gmail.com',
            name: 'Pulsar Motors'
        },
        dynamicTemplateData: {
            qrcode: qrCodeUrl,
            carimage: carImage,
            firstname: firstName
        },
        templateId: 'd-845517024e0f404e8fa2aa4fe5e62eac'
    };
    // Send the email
    try {
        await sgMail.send(msg);
    } catch (err) {
        throw new SendEmailError(err.message);
    }
}
