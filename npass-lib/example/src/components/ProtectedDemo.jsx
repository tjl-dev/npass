import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { NpassTokenMetaView } from 'npass';

class ProtectedDemo extends Component {
  constructor(props) {
    super(props);
    this.onTokenVerified = this.onTokenVerified.bind(this)
    this.state = {
      tokenData: {},
      contentDetails : {
        'max-width': 800,
        contentId: '/npass/protected/site',
      }
    }
  }

  onTokenVerified(tokenData) {
    console.log('onTokenVerified(): ', tokenData)
    this.setState({
        tokenData,
    })
  }

  render() { 
    const npassProps = {
      contentDetails: this.state.contentDetails,
      paymentDetails: this.props.config,
      onTokenVerified: this.onTokenVerified,
      tokenData: this.state.tokenData || {}
    };
    npassProps.contentDetails.site = window.location.origin
    return <div style={{display: "inline-block", padding:"20px"}}>
              <Link to="/npass"><small>&#8592;Back</small></Link>    
              <h3>nPass Tokens for userless paid site login</h3>
              <br></br>
              <p>This page is only accessible to users with a valid nPass Token - see your token details below.</p>   
              <p>Since you're here, why not enjoy some educational content produced by <a href="http://nano.org" >Nano.org</a>:</p>
              <br></br>
              <iframe src="https://player.vimeo.com/video/253563861" width="640" height="480" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
              <br></br>
              <br></br>
              <div style={{fontSize: "small"}}>
                <NpassTokenMetaView {...npassProps} style={{margin:"40px"}} />        
              </div>      
          </div>
  }
}

export default ProtectedDemo