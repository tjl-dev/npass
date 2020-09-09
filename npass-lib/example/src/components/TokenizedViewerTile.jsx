import React, {Component} from 'react';
import Card from 'react-bootstrap/Card'
import Toast from 'react-bootstrap/Toast'
import { NpassTokenImage, NpassTokenVideo, NpassTokenMetaView } from 'npass';
import './TokenizedViewerTile.css';

class TokenizedViewerTile extends Component {
    constructor(props){
        super(props);

        this.onTokenVerified= this.onTokenVerified.bind(this);
        this.onTokenFailed = this.onTokenFailed.bind(this);
        this.selectNpassViewer = this.selectNpassViewer.bind(this);

        const npassContent = this.selectNpassViewer(props.contentDetails.viewerType) || "No Viewer defined for type: " + props.viewerType;

        this.state = {
            showToast: false,
            showError: false,
            showToken: false,
            totalReceived: 0,
            errorMessage: "",
            npassContent,
            contentDetails: props.contentDetails, 
            paymentDetails: props.paymentDetails
        }
    }

    selectNpassViewer(viewerType) {
        const viewers = {
            'image': () => NpassTokenImage,
            'video': () => NpassTokenVideo,
            //'article': () => NpassTokenArticle,
            'default': () => null
        }
        return viewers[viewerType || 'default']()
    }

    onTokenVerified(tokenData) {
        console.log('onTokenVerified(): ', tokenData)
        this.setState({
            tokenData,
            showToast: true,
            showToken: true
        })
    }

    onTokenFailed(message) {
        console.log('onTokenFailed(): ', message)
        this.setState({
            errorMessage: "Failed to retrieve valid token: " + (message.error || JSON.stringify(message)),
            showError: true,
        })
    }

    render() {
        const NpassContent = this.state.npassContent;
        const showToast = this.state.showToast;
        const showError = this.state.showError;
        const showToken = this.state.showToken;
        const errorMessage = this.state.errorMessage;
        const title = this.state.contentDetails.title;
        const tokenData = this.state.tokenData || {};
        const tokenExpiry = tokenData.expiry? 'Valid Till ' + new Date(0).setUTCSeconds(tokenData.expiry *1000) : 'None'
        const tokenPrice = tokenData.price? tokenData.price.toFixed(8).replace(/0+$/,"") : ''

        const npassProps = {
            onTokenVerified: this.onTokenVerified,
            onTokenFailed: this.onTokenFailed,
            contentDetails: this.state.contentDetails,
            paymentDetails: this.state.paymentDetails,
        };        

        return (
            <Card  >
                <Card.Header className="viewer-label">
                    {title}
                </Card.Header>
                <div className="viewer-card">
                    <NpassContent {...npassProps} />
                    <div className="viewer-payment-notification">
                        <Toast onClose={() => this.setState({showToast: false})} show={showToast} delay={2000} autohide>
                            <Toast.Header>
                                Token Verified
                            </Toast.Header>
                            <Toast.Body>
                                <strong className="mr-auto">Retrieved an nPass token for {tokenPrice} nano. Thank you!</strong>
                            </Toast.Body>
                        </Toast>
                        <Toast onClose={() => this.setState({showError: false, errorMessage: ""})} show={showError} delay={5000} autohide>
                            <Toast.Header>
                                Payment Error
                            </Toast.Header>
                            <Toast.Body>
                                {errorMessage}
                            </Toast.Body>
                        </Toast>
                    </div>
                    {showToken? 
                        <div className="token-meta-viewer">
                            <NpassTokenMetaView {...npassProps}  />      
                        </div>
                    : null }
                </div>

                <Card.Footer className="viewer-card-footer">
                    <div className="viewer-payment-summary">
                        <p> Token: {tokenExpiry}  </p>
                    </div>
                </Card.Footer>
            </Card>
        )
    }
}

export default TokenizedViewerTile;
