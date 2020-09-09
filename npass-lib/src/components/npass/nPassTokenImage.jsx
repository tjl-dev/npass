import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import icon from './../../image/npass.icon.png';
import styles from './../../styles.module.css'
import nPassTokenProvider from './nPassTokenProvider'
import {toPrice} from './util.js'

export class nPassTokenImage extends Component {

    constructor(props){
        super(props)
        this.createToken = this.createToken.bind(this)
        this.onTokenReceived = this.onTokenReceived.bind(this)
        this.fetchImage = this.fetchImage.bind(this)

        this.state = {
            token: null,
            imageObjectUrl: null,
            active: false,
            hasExtension: false
        }
    }

    componentWillMount() {
        this.tokenProvider = new nPassTokenProvider();
        this.tokenProvider.init().then(async ()=>{
            try{
                const token = await this.tokenProvider.fetchExistingToken(this.props.contentDetails, this.props.paymentDetails)
                this.onTokenReceived(token)
            }
            catch(e) {
                console.log('failed to fetch existing token', e)
            }
            this.setState({ hasExtension: true })            
        }).catch( error => {
            console.log('failed to initialize nPass ',error)
        })
    }

    async createToken(priceInfo) {
        const disabled = this.props.disabled
        if(!disabled)
        {
            try{
                if(this.props.onTokenRequesting)
                    this.props.onTokenRequesting()
                const token = await this.tokenProvider.createNewToken(this.props.contentDetails, this.props.paymentDetails, priceInfo)
                this.onTokenReceived(token)
            }
            catch(e) {
                console.log('failed to create new token', e)
                if(this.props.onTokenFailed)
                    this.props.onTokenFailed('failed to create new token: ' +  e.error? e.error : JSON.stringify(e))
            }
        }
    }

    onTokenReceived(tokenResponse) {
        this.setState({token: tokenResponse.tokenData.token, tokenData: tokenResponse.tokenData})
        this.fetchImage(this.props.contentDetails.src, tokenResponse.tokenData.token)
    }

    fetchImage(url, token) {
        fetch(url, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
              'Authorization': 'Bearer ' + token 
            }
        })
        .then(response => response.blob())
        .then(images => {
            var imageObjectUrl = URL.createObjectURL(images)
            this.setState({imageObjectUrl, active: true})       
            if(this.props.onTokenVerified)
                setTimeout(() => this.props.onTokenVerified(this.state.tokenData), 200)     
        })
    }

    render(){
        const preview = this.props.contentDetails.preview
        const hasExtension = this.state.hasExtension
        const disabled = this.props.disabled
        const minimal = this.props.contentDetails.minimal || disabled

        const active = this.state.active
        const imageObjectUrl = this.state.imageObjectUrl      
        const maxwidth = this.props.contentDetails['max-width']
        const maxheight = this.props.contentDetails['max-height']
        let style = {
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
        }
        if(maxwidth)
          style['maxWidth'] = maxwidth
        if(maxheight)
          style['maxHeight'] = maxheight
        if(disabled && !active)
            style['opacity'] = 0.5

        if(!hasExtension){
            return(
                <div style={style} className={styles.nPassContentWrapper}  >
                    { !minimal &&
                        <p> This content is only available on Chrome with the nPass extension installed.</p>
                    }
                    <img src={preview} style={style} alt="" />
                    <a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank" >Install nPass Extension </a>
                </div>
            );
        }

        const prices = this.props.paymentDetails.prices
        const lowestPriceKey = Object.keys(prices).reduce((a, b) => prices[a].price < prices[b].price ? a : b)
        const lowestPriceInfo = prices[lowestPriceKey] || {}
        const lowestPrice = lowestPriceInfo.price
        const overlayText = lowestPrice ? ` ${toPrice(lowestPrice)} nano` : "nPass Token required"
        const purchaseTokenButtons = minimal? null : Object.keys(prices).map( priceInfoKey =>
            <Button size="sm" variant="outline-info" onClick={() => this.createToken(prices[priceInfoKey], true)} key={priceInfoKey}>
              <img src={icon} className={styles.npassButtonIcon} alt="npass:" /> {priceInfoKey}: {toPrice(prices[priceInfoKey].price)} nano
            </Button>
        )

        return (
            <div style={{display: 'grid', margin: '10px'}} >
                <div className={styles.nPassContentWrapper}  style={style}>
                    <div >
                        { active ? (
                                <div>
                                    <div className={styles.nPassContentWrapper} >
                                        <img src={imageObjectUrl} style={style}  alt="" />
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => this.createToken(lowestPriceInfo)}>
                                    {
                                        preview && <img src={preview}  style={style} alt="" />
                                    }
                                    {  !disabled && !minimal &&
                                        <svg  className={styles.imageOverlayPlayButton} viewBox="0 0 240 120" alt="View image"  >
                                            <circle cx="120" cy="60" r="30" fill="none" strokeWidth="4" stroke="#fff"/>
                                            <polygon points="110, 45 110, 75 140, 60" fill="#fff" />
                                            <image href={icon} height="20px" width="20px"  x="80" y="100" />
                                            <text x="100" y="115" className={styles.svgPrice}>{overlayText}</text>
                                        </svg>
                                    }
                                </div>

                            )
                        }
                    </div>
                </div>
                { active == false && minimal == false &&
                <div style={{display: 'grid', margin: '10px', position: "absolute", right: "20%", top: "70%"}}>
                    <span style={{margin: '15x'}}> Purchase an nPass Token to view this content: </span>
                    {purchaseTokenButtons}
                </div>
                }
            </div>
        );
    }
}

export default nPassTokenImage;
