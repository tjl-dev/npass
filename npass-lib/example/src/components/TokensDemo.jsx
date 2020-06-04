import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TokenizedViewerTile from './TokenizedViewerTile';
import './../App.css';
import 'npass/dist/index.css';

class TokensDemo extends Component {
    constructor(props) {
        super(props);
        this.initViewers = this.initViewers.bind(this);
        this.state = {viewers: {}}
    }

    async componentDidMount() {
        try {
            const pricesResponse = await fetch(`/npass/data/prices.json`)
            let that = this
            if (!pricesResponse.ok) 
                throw Error(pricesResponse.statusText)

            pricesResponse.json().then(function(data) {
                that.setState({prices: data})            
            })

            const contentResponse = await fetch(`/npass/data/content.json`)
            if (!contentResponse.ok) 
                throw Error(contentResponse.statusText)

            contentResponse.json().then(function(data) {
                that.setState({content: data})
                that.initViewers(data)                            
            })      
        } catch (error) {
            console.log('Failed to fetch content and prices: -S', error)
        }
    }

    initViewers() {
        const viewers = {}
        const content = this.state.content
        const prices = this.state.prices
        Object.keys(content.images).forEach(imageName => {
            viewers[imageName] = {contentDetails: content.images[imageName],  paymentDetails: {prices: prices.imagePrices, ...this.props.config} }
        })
        Object.keys(this.state.content.videos).forEach(videoName => {
            viewers[videoName] = {contentDetails: content.videos[videoName],  paymentDetails: {prices: prices.videoPrices, ...this.props.config} }
        })
        this.setState({viewers});
    }

    render() {
        const viewers = this.state.viewers || {};

        if(Object.keys(viewers).length == 0)
            return <div></div>

        return (
            <div className="div-center">
                <Link to="/npass"><small>&#8592;Back</small></Link>
                <h3>nPass Tokens: access to individual content items</h3>
                <table>
                <tbody>                
                    <tr>
                        <td>
                            <TokenizedViewerTile {...viewers['Photography']}/>
                        </td>
                        <td>
                            <TokenizedViewerTile {...viewers['Art']}/>
                        </td>
                    </tr>          
                    <tr>
                        <td colSpan="2">
                            <TokenizedViewerTile {...viewers['Video: Snow']}/>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2">
                            <TokenizedViewerTile {...viewers['Video: Rain']}/>
                        </td>
                    </tr>
                </tbody>
                </table>
            </div>
        );
    }
}

export default TokensDemo;
