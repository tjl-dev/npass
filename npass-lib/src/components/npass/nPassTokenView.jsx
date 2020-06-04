import React, {Component} from 'react';
import Table from 'react-bootstrap/Table'
import icon from './../../image/npass.icon.png';
import nPassTokenProvider from './nPassTokenProvider'
import {toPrice} from './util.js'

export class nPassTokenView extends Component {

    constructor(props){
        super(props)
        this.onTokenReceived = this.onTokenReceived.bind(this)

        this.state = {
            tokenData: null,
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

    onTokenReceived(tokenResponse) {
        this.setState({tokenData: tokenResponse.tokenData, active: true})
        if(this.props.onTokenVerified)
            this.props.onTokenVerified(tokenResponse.tokenData)
    }


    render(){
        const preview = this.props.contentDetails.preview
        const hasExtension = this.state.hasExtension

        if(!hasExtension){
            return(
                <div style={{display: 'grid', margin: '10px'}}>
                    <h4> This content is only available on Chrome with the nPass extension installed.</h4>
                    <img src={preview} style={style} alt="" />
                    <a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank" > Install nPass Extension </a>
                </div>
            );
        }

        const active = this.state.active    
        const tokenData = this.state.tokenData || {}
        const expiry = tokenData.expiry? '' + new Date(tokenData.expiry *1000) : ""
        const fromAddress = tokenData.fromAddress || ""
        const toAddress = tokenData.toAddress || ""
        const price = tokenData.price? toPrice(tokenData.price) : ""
        const site = tokenData.site || ""
        const content = tokenData.contentId || ""
        const timestamp = tokenData.timestamp? '' + new Date(tokenData.timestamp) : ''
        const tokenRequestId = tokenData.tokenRequestId || ""
        const maxwidth = this.props.contentDetails['max-width']
        const maxheight = this.props.contentDetails['max-height']

        let style = {
            border: "2px solid #e1e5ea",
            borderRadius: "10px",
            margin: '5px',       
            display: "block",
            marginLeft: "auto",
            marginRight: "auto", 
        }
        if(maxwidth)
            style['maxWidth'] = maxwidth
        if(maxheight)
            style['maxHeight'] = maxheight

        return (
            <div style={style} >
                <div style={{display:"inline"}}>
                    <img style={{height:"40px", width:"40px"}} src={icon} /> <strong>nPass Token Details</strong>
                </div>
                { active ? (
                        <Table bordered hover size="sm">
                            <tbody>
                                <tr><td>Token Id: </td><td>{tokenRequestId}</td></tr>
                                <tr><td>Site: </td><td>{site}</td></tr>
                                <tr><td>Content: </td><td>{content}</td></tr>
                                <tr><td>Price: </td><td>{price} nano</td></tr>                          
                                <tr><td>From Address: </td><td>{fromAddress}</td></tr>
                                <tr><td>To Address: </td><td>{toAddress}</td></tr>
                                <tr><td>Timestamp: </td><td>{timestamp}</td></tr>
                                <tr><td>Expiry: </td><td>{expiry}</td></tr>
                            </tbody>
                        </Table>
                    ) : (
                        <span>No Token</span>
                    )
                }
            </div>
        );
    }
}

export default nPassTokenView;
