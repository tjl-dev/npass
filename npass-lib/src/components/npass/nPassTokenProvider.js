import { isChrome, uuidv4 } from './util'

const NPASS_EXTENSION_ID = 'oohcmndahocfeiebkkdcbceeaanheafc' 
const NPASS_VERSION = 1

export class nPassTokenProvider {
    constructor() {
        this.hasExtension = false;
        this.userAddress = '';
    }

    init() {
        const self = this
        return new Promise((resolve, reject) => {
            if(isChrome() && chrome && chrome.runtime) // eslint-disable-line no-undef
            {
                chrome.runtime.sendMessage(NPASS_EXTENSION_ID, { message: "nPass.Version" },  // eslint-disable-line no-undef
                (reply) => {
                    if (reply) {
                        if (reply.version) {
                            console.log('reply.version: ', reply);
                            // todo: better version check and typing - this is not very useful.
                            if (reply.version >= NPASS_VERSION) {
                                self.hasExtension = true,
                                self.userAddress = reply.address    
                                resolve()  
                            }
                        }
                        reject("Bad nPass version")  
                    }
                    reject("null response from nPass extension")
                    console.log('hasExtension: ', self.hasExtension);
                });
            }
        })
    }

    fetchExistingToken(contentDetails, paymentDetails) {
        const self = this
        return new Promise((resolve, reject) => {
            const tokenRequestId = uuidv4()
            const salt = Math.floor(Math.random() * 10000)
            const timestamp = + new Date();
            const duration = 0
            const price = 0
            const expiry = 0
            const tokenRequest = {
                toAddress: paymentDetails.toAddress,
                fromAddress: self.userAddress,
                site: contentDetails.site || window.location.href,
                contentId: contentDetails.contentId,
                tokenRequestId,
                salt,
                timestamp,
                expiry,
                price,
                tokenLifeSeconds: duration
            };

            if(!this.hasExtension)
                reject("nPass Extension not found")

            chrome.runtime.sendMessage(NPASS_EXTENSION_ID, { message: "nPass.TokenRequest", data: tokenRequest },  // eslint-disable-line no-undef
            (reply) => {
                if (reply) {
                    if (reply.status) {
                        console.log('token reply: ', reply);
                        // basic checks here, to be double checked on server side
                        if (reply.status === 'Token Request Fulfilled'
                            && reply.tokenData
                            && reply.tokenData.token
                            && reply.tokenData.token.length
                            && reply.tokenData.toAddress === tokenRequest.toAddress
                            && reply.tokenData.fromAddress === self.userAddress
                            && reply.tokenData.contentId === tokenRequest.contentId
                            && reply.tokenData.site === tokenRequest.site ) {
                            
                            resolve(reply);
                        }
                        else {
                            console.log('Failed to fetch token: ', reply);
                            reject(reply);
                        }
                    }
                }
            });
        })
    }

    createNewToken(contentDetails, paymentDetails, priceInfo) {
        const self = this
        return new Promise((resolve, reject) => {
            const tokenRequestId = uuidv4();
            const salt = Math.floor(Math.random() * 10000)
            const timestamp = + new Date();
            const duration = priceInfo.durationSeconds ? priceInfo.durationSeconds : 60 * 60 * 24
            const price = priceInfo.price? priceInfo.price : 0  // todo better default
            const expiry = Math.floor(Date.now()/1000) + Number(duration)
            const tokenRequest = {
                toAddress: paymentDetails.toAddress,
                fromAddress: self.userAddress,
                site: contentDetails.site || window.location.href,
                contentId: contentDetails.contentId,
                tokenRequestId,
                salt,
                timestamp,
                expiry,
                price,
                tokenLifeSeconds: duration,
                generate: true
            };

            if(!this.hasExtension)
                reject("nPass Extension not found")

            chrome.runtime.sendMessage(NPASS_EXTENSION_ID, { message: "nPass.TokenRequest", data: tokenRequest },  // eslint-disable-line no-undef
            (reply) => {
                if (reply) {
                    if (reply.status) {
                        console.log('reply.status: ', reply.status);
                        if (reply.status === 'Token Request Fulfilled'
                            && reply.tokenData
                            && reply.tokenData.token
                            && reply.tokenData.token.length
                            && reply.tokenData.toAddress === tokenRequest.toAddress
                            && reply.tokenData.fromAddress === self.userAddress
                            && reply.tokenData.price === tokenRequest.price  
                            && reply.tokenData.tokenLifeSeconds === tokenRequest.tokenLifeSeconds  
                            && reply.tokenData.contentId === tokenRequest.contentId
                            && reply.tokenData.site === tokenRequest.site ) {
                            
                            resolve(reply);
                        }
                        else {
                            console.error('ERROR: Invalid response from nPass extension ', reply);
                            reject(reply);
                        }
                    }
                }
            });
        })
    }
}

export default nPassTokenProvider

