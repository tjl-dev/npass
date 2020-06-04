import React, {Component} from "react"
import Card from 'react-bootstrap/Card'
import CardDeck from 'react-bootstrap/CardDeck'
import { Link } from 'react-router-dom';
import nanoIcon from '../image/nano.icon.png';
import tokenExample from '../image/npass.exampleImage2.png';
import loginExample from '../image/npass.exampleImage3.png';
import imageTokenCode from '../image/npasstokenimage_code.png';
import loginTokenCode from '../image/npasstokenlogin_code.png';
import diagram from '../image/npass_component_diagram.png';
import './Home.css';

class Home extends Component {

    render() {
        const nanoLink = <a href="https://nano.org/"><img src={nanoIcon} style={{width:"30px"}} alt="nano logo/" /><strong>Nano</strong></a>
        const contentDemoLink = <a href="https://www.youtube.com/watch?v=NHbTMEj284U" target="_blank">recorded demo</a>
        const loginDemoLink = <a href="https://www.youtube.com/watch?v=I0JzNKR5zuM" target="_blank">login demo</a>
        return  <div style={{padding: "20px"}}>
                       
                    <div style={{display: "inline-grid"}} >
                        <Card style={{ margin: "20px" }}>
                            <Card.Header >
                                <strong>Overview</strong>
                            </Card.Header> 
                            <div style={{textAlign: "centre", margin: "30px"}}  className="summary">
                                <h6 >The goal of nPass is to demonstrate a viable alternative to ad-supported content:
                                    <ul >
                                        <li>No more ads.</li>
                                        <li>No need for user registration.</li>
                                        <li>Direct compensation for your content.</li>
                                        <li>Easy to add to your website.</li>
                                        <li>Easy to add to your browser.</li>
                                    </ul>
                                </h6> 

                                <br></br>   
                                <h6>Built on the {nanoLink} network - enabling fast and feeless transactions.</h6>
                            </div>  
                        </Card>

                        <CardDeck>
                            <Card style={{width: "500px", margin: "5px" }}>
                                <Card.Header >
                                    <strong>Demo: nPass Tokens for content access</strong>
                                </Card.Header>    
                                    <div style={{height: "600px", padding: "10px"}} className="summary">
                                        <div class="text-center">
                                            <a href="/npass/tokens" ><img src={tokenExample} style={{width: "300px"}} alt="example npass content access"></img></a>
                                        </div>
                                        <br></br>
                                        <ul >
                                            <li>Generate nPass tokens for access to specific content</li>
                                            <li>Currently supports image and video content</li> 
                                            <li>Content is not accessible without a valid token</li>
                                            <li>nPass tokens are created at the click of a button</li>
                                            <li>nPass tokens can be reused until they expire</li>
                                            <li>Payment details easily configurable</li>                                                                                                      
                                        </ul>
                                        {/* <img src={imageTokenCode} style={{width: "300px"}} alt="example npass image code"></img> */}
                                    </div>          
                                <Card.Footer>
                                    <Link to="/npass/tokens"><strong>Try it out </strong></Link> 
                                    (<a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank">extension</a> required) or watch a {contentDemoLink}
                                </Card.Footer> 
                            </Card>

                            <Card style={{width: "500px", margin: "5px" }}>
                                <Card.Header >
                                    <strong>Demo: nPass Tokens for web auth</strong>
                                </Card.Header>    
                                    <div style={{height: "600px", padding: "10px"}} className="summary"> 
                                        <div class="text-center">
                                            <a href="/npass/protected/site" ><img src={loginExample} style={{width: "300px"}} alt="example npass site access"></img></a>
                                        </div>
                                        <br></br> 
                                        <ul >
                                            <li>nPass tokens can be used as an alternative to user login</li>
                                            <li>Individual pages or url routes can be paywalled</li> 
                                            <li>Page is not accessible without a valid token</li>
                                            <li>nPass tokens are created at the click of a button</li>
                                            <li>nPass tokens can be reused until they expire</li>
                                            <li>Payment details easily configurable</li>                                                                                                   
                                        </ul>
                                        {/* <img src={loginTokenCode} style={{width: "300px"}} alt="example npass login code"></img> */}
                                    </div>                    
                                <Card.Footer>
                                     <a href="/npass/protected/site" target='_self'><strong>Try it out </strong></a>
                                    (<a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank">extension</a> required) or watch a {loginDemoLink}
                                </Card.Footer> 
                            </Card>
                        </CardDeck> 

                        <Card style={{ margin: "20px" }}>
                            <Card.Header >
                                <strong>About nPass</strong>
                            </Card.Header> 
                            <div style={{textAlign: "left", margin: "30px"}}>
                                <h6>What is it?</h6> 
                                <p>nPass offers a <a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank">chrome extension</a> that produces paid nano-tokens on request, 
                                    and a set of <a href="https://github.com/tjl-dev/npass" target="_blank">html/js components</a> enabling token based access to site content.</p>
                                <br></br>
                                <h6>How does it work?</h6>
                                <p> Using chrome's extension messaging, json web tokens, and Nano based transactions, nPass generates tokens on demand that can be verified by website owners to provide access to content. Sample architecture <a href="#architecture">here</a>.</p>
                                <br></br>
                                <h6>Why?</h6> 
                                <p>A general aversion to ad-supported content, everywhere. <br></br><br></br>Benefits for the user:</p>
                                <ul>
                                    <li><strong>No more time spent viewing ads.</strong> nPass makes it possible to spend 0.0001 nano rather than disrupting your attention and wasting 15 seconds of your life with yet another commercial (think Youtube, Spotify).</li>
                                    <li><strong>No blanket subscription.</strong>  Unlike Netflix there's no need for a formal monthly subscription, which gives the user more control over what they pay to see.</li>
                                </ul>
                                <p>Benefits for the publisher:</p>
                                <ul>
                                    <li><strong>Set your own prices.</strong> No need to depend on the advertising market.</li>
                                    <li><strong>Take out the middle man.</strong> All payments go direct from the user's extension wallet to your designated wallet.</li>
                                </ul>
                            </div>  
                        </Card>

                        <Card style={{ margin: "20px" }} id="architecture" >
                            <Card.Header >
                                <strong>nPass Component Diagram</strong>
                            </Card.Header> 
                            <div style={{display: "block", marginLeft: "auto", marginRight: "auto"}}>
                                <img src={diagram} width="1200px"></img>
                            </div>  
                        </Card>
  
                        <Card style={{ margin: "20px" }}>
                            <Card.Header >
                                <strong>Notes</strong>
                            </Card.Header>   
                            <div style={{textAlign: "left", margin: "30px"}}>
                                <ul style={{marginBottom: "10px"}}>
                                    <li>Why Nano? {nanoLink} is ideally suited for small and fast micro transactions, being feeless with near instantaneous confirmations. Nano has a proven network that has been functional and secure for many years, with an active community that continues to see strong development.</li>
                                    <li>The nPass extension <u>does not use a remote custodial solution</u> - you own your crypto keys, and keys are never sent over the network. The extension offers functionality to manage (create/export/import) your keys locally.</li>
                                    <li>nPass <u>does not take a cut of any transaction</u> - all transactions flow from the user's wallet to the site's designated address(es).</li>
                                    <li>nPass allows you to automate token generation for whitelisted domains - no need to click buttons to access content for sites you trust.</li>
                                    <li>nPass supports capping the spend limit per time period for individual domains.</li>
                                    <li>Any content publisher can easily integrate npass to their site to generate a direct income stream. For an example site setup, see the github link below.</li>
                                    <li>nPass provides an API service for content providers to easily verify access tokens. Example architecture diagram <a href="#tbd">here</a>.</li>
                                    <li>nPass is currently at proof of concept stage, and should not be trusted to secure your money. While testing, please do not send more than a trivial amount of nano to the address used by the extension.</li>                                
                                    <li>Recommendation: use a Nano faucet to obtain a small amount of nano for free to safely test the nPass extension. You can find a list of free nano faucets here:  <a href="https://nanolinks.info/#faucets-free-nano">https://nanolinks.info/#faucets-free-nano</a>.</li>
                                </ul>
                            </div> 
                        </Card>
                        <Card style={{ margin: "20px"}}>
                            <Card.Header >
                                <strong>Links</strong>
                            </Card.Header>  
                            <div style={{textAlign: "left", margin: "30px"}}>
                                <ul>
                                    <li>Chrome Web Store: Install the <a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank"> nPass Chrome extension</a></li>
                                    <li>nPass extension intial setup <a href="https://github.com/tjl-dev/npass#extension-setup-instructions">instructions</a></li>
                                    <li>nPass <a href="https://github.com/tjl-dev/npass">github code repository</a> - component library with example site and content server</li>
                                    <li>A brief Introduction to Nano: <a href="https://docs.nano.org/what-is-nano/overview/">https://docs.nano.org/what-is-nano/overview/</a></li>
                                    <li>Nano documentation: <a href="https://docs.nano.org/">https://docs.nano.org/</a></li>  
                                    <li>Nano wallets: <a href="https://nanolinks.info/#wallets">https://nanolinks.info/#wallets</a></li>
                                    <li>Nano faucets - free nano in small quantities: <a href="https://nanolinks.info/#faucets-free-nano">https://nanolinks.info/#faucets-free-nano</a></li>
                                </ul>                         
                            </div>  
                        </Card>
                        </div>
                </div>        
    }
}

export default Home