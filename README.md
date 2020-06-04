
# <img src="https://npass.dev/npass/images/nPass.2.png" width="80"> nPass - Nano based tokens for web access

Note: nPass library code & example site will be migrated after June 5th 2020

# Overview
nPass is a chrome extension that interacts with web sites to provide paid access tokens, both for the general case of logging in to a site (no user registration required), and for access to individual content (no need to watch commercials).

The goal of nPass is to demonstrate a viable alternative to ad-supported content:
* No more ads.
* No need for user registration.
* Direct compensation for your content.
* Easy to add to your website.
* Easy to add to your browser.

![Screenshot](https://npass.dev/npass/images/nPass.marquee.png)

Visit [https://npass.dev/npass](https://npass.dev/npass) for a detailed overview and live demonstration.

Built on the [Nano](https://nano.org/) cryptocurrency network - enabling fast and feeless transactions.

# Extension Setup Instructions
*  Install the [nPass chrome extension](https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc)
*  Create a wallet. Export your generated keys to local file if you want to keep a backup. Beware of the risks involved with key management here.

![Wallet Screen](https://npass.dev/npass/images/nPass.screen.wallet.png)
*  A QR code should be displayed on the Wallet page (accessible from the drop down menu in the extension)
*  Using the QR code and your existing Nano wallet, send the nPass wallet a small amount of Nano for testing. A fraction of a Nano should suffice (e.g. 0.5 Nano), as the demo tokens don't cost much.
*  The nPass wallet should detect the pending transaction and generate a receive block. A message will popup when it is received.
*  Your wallet amount should be reflected on the Home page of the extension.

![Home Screen](https://npass.dev/npass/images/nPass.screen.home.png)
*  Visit [https://npass.dev/npass](https://npass.dev/npass) to try out the two demonstration examples - one demonstrates accessing media items, the other demonstrates paywalled access or site login using nPass tokens.
*  To avoid the alert popping up on every token purchase, you can select AutoPay in the extension Settings screen. You can cap the amoun of Nano that is spent in total, or per domain.

![Settings Screen](https://npass.dev/npass/images/nPass.screen.settings.png)
*  Any tokens purchased from the demo site should be visible in the extension

![Token Screen](https://npass.dev/npass/images/nPass.screen.tokens.png)


# Site Integration

The npass-lib component library makes it easy to wrap your media content or web page with support for nPass token request and validation.

For example, to wrap an image with nPass support:
```javascript
  const npassProps = {
      onTokenVerified: this.onTokenVerified,
      onTokenFailed: this.onTokenFailed,
      contentDetails: this.state.contentDetails,
      paymentDetails: this.state.paymentDetails,
  };  
  <NpassTokenImage {...npassProps} />
```
See the example site under npass-lib\example\src\App.js for further examples of how to wrap your content. 

The npass-lib components will automate token request from the extension, and inject the received nPass Token into GET requests for the embedded content.

To process token validation securely, the site should run a simple back end service to handle the http(s) GET requests using a Bearer token in the Authentication header. A sample web server with the nPass Auth handler is provided under the npass-demo module.

Feel free to raise an issue or contact directly for any questions on site integration.


# Architecture
![nPass Component Diagram](https://npass.dev/npass/images/npass_component_diagram.png)
