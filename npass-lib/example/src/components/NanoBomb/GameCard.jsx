import React, {Component} from 'react';
import Card from 'react-bootstrap/Card'
import Toast from 'react-bootstrap/Toast'
import Spinner from 'react-bootstrap/Spinner'
import { NpassTokenImage, NpassTokenMetaView } from 'npass';
import npassIcon from '../../image/npass.icon.png';
import './NanoBomb.css'

class GameCard extends Component {
    constructor(props){
        super(props);

        this.onTokenRequesting = this.onTokenRequesting.bind(this);
        this.onTokenVerified = this.onTokenVerified.bind(this);
        this.onTokenFailed = this.onTokenFailed.bind(this);

        const contentDetails = {
            "title": "",
            "contentId": `/npass/nanobomb/protected/${props.sessionId}/${props.cardId}`,
            "preview": "/npass/nanobomb/preview/UNKNOWN.png",
            "src": `/npass/nanobomb/protected/${props.sessionId}/${props.cardId}`,
            "max-width": 100,
            "max-height" : 100,
            minimal: true
        }

        const paymentDetails = {  
            prices : {           
                "Forever": {
                    "durationSeconds": 9999999999,
                    "price": Number(this.props.cardPrice)
                }         
            },
            toAddress: 'nano_3swpttz8t86zywz7xa83wb9ygsq89y71i7eyg9ackeix1nubzng9uj7aw9ha'
        }

        this.state = {
            contentDetails, 
            paymentDetails,
            showToast: false,
            showSpinner: false,
            spinnerTimer: null
        }
    }

    onTokenRequesting() {
        console.log('onTokenRequesting()')
        if(this.state.spinnerTimer) {
            clearTimeout(this.state.spinnerTimer)
        }
        const spinnerTimer = setTimeout(()=>{
            console.log('spinner timeout')
            this.setState({
                showSpinner: false,
                spinnerTimer: null
            })
        }, 20000)   
        this.setState({
            showSpinner: true,
            spinnerTimer
        })       
    }

    onTokenVerified(tokenData) {
        console.log('onTokenVerified(): ', tokenData)
        if(this.state.spinnerTimer) {
            clearTimeout(this.state.spinnerTimer)
        }
        this.setState({
            tokenData,
            showToast: true,
            showSpinner: false,
            spinnerTimer: null
        })
        this.props.fetchState()
    }

    onTokenFailed(message) {
        console.log('onTokenFailed(): ', message)
        if(this.state.spinnerTimer) {
            clearTimeout(this.state.spinnerTimer)
        }
        this.setState({
            showSpinner: false,
            spinnerTimer: null
        })
        this.props.fetchState()
    }

    render() {
        const showToast = this.state.showToast
        const showSpinner = this.state.showSpinner
        const npassProps = {
            contentDetails: this.state.contentDetails,
            paymentDetails: this.state.paymentDetails,
            onTokenRequesting: this.onTokenRequesting,
            onTokenVerified: this.onTokenVerified,
            onTokenFailed: this.onTokenFailed,
            disabled: !(this.props.active)
        };        
        const npass = <img src={npassIcon} style={{width:"25px"}} alt="npass"/>
        const cardData = this.props.cardData || {}
        const isBomb = cardData.cardType && cardData.cardType == "BOMB"
        const isColin = cardData.cardType && cardData.cardType == "COLIN"
        const isBomber = cardData.cardType && cardData.cardType == "BOMBER"
        const hints = cardData.hints || []
        const dangerHint = hints.includes("BOMB")
        const heartHint = hints.includes("HEART")
        const cointHint = hints.includes("NANOCOIN")
        const tripletHint = hints.includes("TRIPLET")
        const borderColor = dangerHint ? "danger" : heartHint? "info" : cointHint? "warning" : "light"
        
        const style = {
            width:"130px", 
            height:"130px", 
            padding:"5px", 
            backgroundColor: isColin? "lightblue" : isBomber? "navajowhite" : isBomb? "mistyrose" : tripletHint? "lightyellow" : "white"
        }

        const spinnerStyle = {
            top: "110px",
            left: "55px",
            position: "absolute"
        }

        const toastStyle ={
            top: "100px",
            left: "50px",
            position:"absolute"            
        }

        return (
            <Card border={borderColor}  >
                <div style={style} >
                    <div className="center"> 
                        <NpassTokenImage {...npassProps} />
                        {showSpinner &&
                            <Spinner animation="border" variant="primary" size="sm" style={spinnerStyle} />
                        }
                    </div>
                </div>
                <Toast onClose={() => this.setState({showToast: false})} show={showToast} delay={2000} style={toastStyle} autohide>
                    <Toast.Body style={{ padding: "2px" }}>
                        {npass}
                    </Toast.Body>
                </Toast>
            </Card>
        )
    }
}

export default GameCard;
