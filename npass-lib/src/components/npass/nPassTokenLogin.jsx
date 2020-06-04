import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import icon from './../../image/npass.icon.png';
import styles from './../../styles.module.css'
import nPassTokenProvider from './nPassTokenProvider'
import {toPrice} from './util.js'

export class nPassTokenLogin extends Component {

    constructor(props){
        super(props)
        this.createToken = this.createToken.bind(this)
        this.onTokenReceived = this.onTokenReceived.bind(this)
        this.postToken = this.postToken.bind(this)

        const contentDetails = this.props.contentDetails
        contentDetails.site = window.location.origin

        this.state = {
            token: null,
            active: false,
            hasExtension: false,
            contentDetails
        }
    }

    componentWillMount() {
        this.tokenProvider = new nPassTokenProvider();
        this.tokenProvider.init().then(async ()=>{
            try{
                const token = await this.tokenProvider.fetchExistingToken(this.state.contentDetails, this.props.paymentDetails)
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
        try{
            const token = await this.tokenProvider.createNewToken(this.state.contentDetails, this.props.paymentDetails, priceInfo)
            this.onTokenReceived(token)
        }
        catch(e) {
            console.log('failed to create new token', e)
            if(this.props.onTokenFailed)
                this.props.onTokenFailed('failed to create new token: ' + e)
        }
    }

    onTokenReceived(tokenResponse) {
        this.setState({token: tokenResponse.tokenData.token})
        this.postToken(this.props.postTokenUrl, tokenResponse.tokenData.token)
        if(this.props.onTokenVerified)
            this.props.onTokenVerified(tokenResponse.tokenData)
    }

    postToken(url, token) {
        fetch(url, {
            method: 'POST',
            withCredentials: true,
            credentials: 'include',
            headers: {
              'Authorization': 'Bearer ' + token
            }
        })
        .then(response => response.blob())
        .then(() => {
            this.setState({active: true})  
            console.log('set timer')
            setTimeout(()=>{
                console.log('timer fired')
                window.location.href =this.props.contentDetails['contentId']
            }, 10000)          
        })
    }

    render(){
        const preview = this.props.contentDetails.preview
        const hasExtension = this.state.hasExtension
        const redirectUrl = this.props.contentDetails['contentId'] || ""
        const loginText = this.props.contentDetails['loginText'] || ""
        const loginSuccessMessage = this.props.contentDetails.loginSuccessMessage || "";

        if(!hasExtension){
            return(
                <div style={{display: 'grid', margin: '10px'}}>
                    <h4> This site is only available on Chrome with the nPass extension installed.</h4>
                    <img src={preview} style={style} alt="" />
                    <a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank" > Install nPass Extension </a>
                </div>
            );
        }

        const active = this.state.active    
        const maxwidth = this.props.contentDetails['max-width']
        const maxheight = this.props.contentDetails['max-height']
        let style = {}
        if(maxwidth)
          style['maxWidth'] = maxwidth
        if(maxheight)
          style['maxHeight'] = maxheight

        const prices = this.props.paymentDetails.prices
        const lowestPriceKey = Object.keys(prices).reduce((a, b) => prices[a].price < prices[b].price ? a : b)
        const lowestPriceInfo = prices[lowestPriceKey] || {}
        const purchaseTokenButtons = Object.keys(prices).map( priceInfoKey =>
            <Button size="sm" variant="outline-info" onClick={() => this.createToken(prices[priceInfoKey], true)} key={priceInfoKey}>
              <img src={icon} className={styles.npassButtonIcon} alt="npass:" />Purchase {priceInfoKey} Token: {toPrice(prices[priceInfoKey].price)} nano
            </Button>
        )

        return (
            <div style={{display: 'grid', margin: '10px'}} >
                <div className={styles.nPassContentWrapper} >
                    <div >
                        { active ? (
                                <div>
                                    <div className={styles.nPassContentWrapper} >
                                        <p>{loginSuccessMessage}</p>
                                        <p>Redirecting to <a href={redirectUrl}>{redirectUrl}</a> ... </p>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => this.createToken(lowestPriceInfo)}>
                                    {
                                        preview && <img src={preview}  style={style} alt="" />
                                    }
                                    <p>{loginText}</p>
                                </div>
                            )
                        }
                    </div>
                </div>
                { active == false &&
                <div style={{display: 'grid', margin: '10px'}}>
                    {purchaseTokenButtons}
                </div>
                }
            </div>
        );
    }
}

export default nPassTokenLogin;
