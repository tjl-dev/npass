import React, {Component} from "react"
import { NpassTokenLogin } from 'npass';
import './../App.css';
import 'npass/dist/index.css';

class Login extends Component {
    constructor(props) {
        super(props);

        this.onTokenVerified= this.onTokenVerified.bind(this);
        this.onTokenFailed = this.onTokenFailed.bind(this);

        const contentDetails = {       
            loginText: "Access to this site requires a valid nPass Token",
            redirectUrl: "/npass/protected/site",
            contentId: '/npass/protected/site',
            loginSuccessMessage: 'Received a valid nPass Token! Redirecting to content in 10 seconds...', 
        }

        this.state = {
            errorMessage: null,
            token: null,
            prices: null,
            contentDetails,
            paymentDetails: this.props.config
        }
    }

    async componentDidMount() {
        try {
            const pricesResponse = await fetch(`/npass/data/prices.json`)
            let that = this
            if (!pricesResponse.ok) 
                throw Error(pricesResponse.statusText)

            pricesResponse.json().then(function(data) {
                that.setState({prices: data, paymentDetails: {...that.props.config, prices: data.loginPrices}})            
            })    
        } catch (error) {
            console.log('Failed to fetch login prices: -S', error)
        }
    }

    onTokenVerified(verifiedToken) {
        console.log('onTokenVerified(): ', verifiedToken)
        this.setState({
            token: verifiedToken,
            showToast: true,
            errorMessage: null
        })
    }

    onTokenFailed(message) {
        console.log('onTokenFailed(): ', message)
        this.setState({
            errorMessage: "Failed to retrieve valid token: " + (message.error || JSON.stringify(message)),
        })
    }

    render() {
        const token  = JSON.stringify(this.state.token) || {}
        const prices = this.state.prices || {}
        const errorMessage  = this.state.errorMessage || ""
        const tokenExpiry = token.expiry? 'nPass Token Valid Till ' + new Date(token.expiry *1000) : ''
        const hasPrices = Object.keys(prices).length > 0

        const npassProps = {
            onTokenVerified: this.onTokenVerified,
            onTokenFailed: this.onTokenFailed,
            contentDetails: this.state.contentDetails,
            paymentDetails: this.state.paymentDetails,  
            postTokenUrl: '/npass/login'
        };

        return ( <div style={{display: "inline-grid", margin: "10px"}}>
                    <h1>nPass Restricted Site Login</h1>
        
                    {hasPrices?
                        <div style={{width: "500px"}} > 
                            <NpassTokenLogin {...npassProps} />
                        </div>
                    :
                        <span>Fetching site access pricing information...</span>
                    }                    

                    <div>
                        <p>{ tokenExpiry }</p>
                        <p>{ errorMessage }</p>
                    </div>
                </div>   
        )     
    }
}

export default Login