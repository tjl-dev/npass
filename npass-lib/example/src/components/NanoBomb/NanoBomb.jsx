import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card'
import GameGrid from './GameGrid';
import nanoIcon from '../../image/nano.icon.png';
import './../../App.css';
import 'npass/dist/index.css';

class NanoBomb extends Component {
    constructor(props) {
        super(props);
        this.initGrid = this.initGrid.bind(this);
        this.newGame = this.newGame.bind(this);
        this.addressChange = this.addressChange.bind(this);
        this.state = {addressValid: false, address: '', newGameError: ''}
    }

    async componentWillMount() {
        try {
            let that = this
            let sessionId = that.props.match.params.sessionId || ''

            if(sessionId.length > 0)
            {
                console.log('loading nanobomb session ' + sessionId)
                const sessionResponse = await fetch(`/npass/nanobomb/game/` + sessionId)
                
                if (!sessionResponse.ok) 
                    throw Error(sessionResponse.statusText)
                    sessionResponse.json().then(function(session) {
                    that.setState({sessionId, session })         
                })   
            }

            console.log('loading nanobomb meta ')
            const metaResponse = await fetch(`/npass/nanobomb/meta`)
            if (!metaResponse.ok) 
                throw Error(metaResponse.statusText)

            metaResponse.json().then(function(meta) {
                that.setState({meta })         
            })    
        } catch (error) {
            console.log('Failed to fetch nanobomb meta: ', error)
        }
    }

    initGrid() {

    }

    addressChange(e) {
        let addressValid = false
        // validate length and format. if OK, enable New Game
        if (e.target.value !== "") {
            if(e.target.value.length >= 64)
            addressValid = true
        }

        // Set the filtered state based on what our rules added to newList
        this.setState({
            addressValid,
            address: e.target.value
        });
    }

    async newGame(address) {
        // get a new game session
        try {
            const newGameResponse = await fetch(`/npass/nanobomb/game/new/` + address)
            if (!newGameResponse.ok) {
                this.setState({newGameError: newGameResponse.statusText})
                throw Error(newGameResponse.statusText)
            }

            let that = this
            newGameResponse.json().then(function(session) {
                //redirect  route to nanobomb/:gameSession  
                console.log('New Session: ', session)
                that.props.history.push("/npass/nanobomb/" + session.sessionId)
                that.props.history.go()
                this.setState({newGameError: ''})
            })    
        } catch (error) {
            console.log('Failed to create new nanobomb game: -S', error)
        }
    }

    render() {
        const sessionId = this.state.sessionId;
        const newEnabled = this.state.addressValid || false
        const meta = this.state.meta || {}
        const jackpot = +(meta.jackpot || 0).toFixed(4) 
        const recentGames = meta.recentGames | ''
        const cardPrice = meta.cardPrice || 0.01
        const playerAddress = this.state.address 
        const serverAddress = meta.address
        const newGameError = this.state.newGameError

        const nanobomb=<img src="/npass/nanobomb/preview/nanobomb.png" height="80px" width="80px"></img>
        const bomb=<img src="/npass/nanobomb/preview/BOMB.png" height="50px" width="50px"></img>
        const heart=<img src="/npass/nanobomb/preview/HEART.png" height="50px" width="50px"></img>
        const nanocoin=<img src="/npass/nanobomb/preview/NANOCOIN.png" height="50px" width="50px"></img>
        const bomber=<img src="/npass/nanobomb/preview/BOMBER.png" height="50px" width="50px"></img>
        const colin=<img src="/npass/nanobomb/preview/COLIN.png" height="50px" width="50px"></img>
        const nothing=<img src="/npass/nanobomb/preview/NOTHING.png" height="50px" width="50px"></img>
        const unknown=<img src="/npass/nanobomb/preview/UNKNOWN.png" height="50px" width="50px"></img>
        const nano = <img src={nanoIcon} style={{width:"30px"}} alt="nano"/>

        return (
            <div className="div-center">
                <Link to="/npass"><small>&#8592;Back</small></Link>
                <h1>{nanobomb}NANOBOMB [beta]{nanobomb}</h1>
                <div>
                    {sessionId && Object.keys(meta).length > 1? 
                        <div>
                            <GameGrid 
                                sessionId={sessionId} 
                                cardPrice={meta.cardPrice} 
                                address={playerAddress} 
                                newGame={this.newGame} />
                        </div>
                    :
                        <div className="div-center" style={{width: "400px"}}> 
                            <Table hover size="sm" style={{textAlign:"left"}}>    
                                <tr>
                                    <td>Current Jackpot</td>
                                    <td>{jackpot}{nano}</td>
                                </tr>
                                <tr>
                                    <td>Card Price</td>
                                    <td>{cardPrice}{nano}</td>
                                </tr>
                            </Table> 
                            <div style={{display: "inline-grid"}}>
                                {/* colour green if addres valid*/}
                                <p>Enter your Nano address to begin a new game:</p>
                                <input type="text"  onChange={this.addressChange} placeholder="Enter your Nano Address..." className={ newGameError.length > 0 ?  "form-control is-invalid" : "form-control" }/>
                                <div className={ newGameError.length > 0 ?  "text-danger" : "hidden" }>{newGameError}</div>
                                <Button disabled={!newEnabled} onClick={() => this.newGame(playerAddress)} >New Game</Button>                            
                            </div>  
                        </div>                  
                    }
                </div>
                <div className="div-center">
                    <Card style={{ margin: "20px", width:"800px"}}>
                        <Card.Header >
                            <strong>Card Legend</strong>
                        </Card.Header>  
                        <Table hover size="sm" style={{textAlign:"left"}}>    
                            <tr>
                                <td width="200px">{unknown}</td>
                                <td>Pay 0.001 NANO to reveal this card</td>
                            </tr>
                            <tr>
                                <td>{nanocoin}</td>
                                <td>Win 0.002 NANO.  Hint: adjacent cards may have a gold border</td>
                            </tr>
                            <tr>
                                <td>{heart}</td>
                                <td>Add a game credit.  Hint: adjacent cards may have a blue border</td>
                            </tr>
                            <tr>
                                <td>{bomb}</td>
                                <td>Lose a game credit.  Hint: adjacent cards will have a red border</td>
                            </tr>
                            <tr>
                                <td>{colin}</td>
                                <td>Jackpot! Win up to 0.02 NANO (actual amount depends on the remaining jackpot pool)</td>
                            </tr>
                            <tr>
                                <td>{bomber}</td>
                                <td>The Bomber: "We have suffered a stolen" - game over; no payout</td>
                            </tr>
                            <tr>
                                <td>{nothing}</td>
                                <td>Nothing. What did you expect?</td>
                            </tr>   
                            <tr>
                                <td>{nanocoin}{nanocoin}{nanocoin}</td>
                                <td>Triplets: 3x for each coin in the triplet </td>
                            </tr>
                        </Table>  
                    </Card>
                </div>
                <Card style={{ margin: "20px", width:"1000px"}}>
                    <Card.Header >
                        <strong>Info</strong>
                    </Card.Header>  
                    <div style={{textAlign: "left", margin: "30px"}}>
                        <p>This game is intended a concept demonstration, a fun game designed to show how <Link to="/npass">nPass Tokens</Link> can be used to provide instant tokenized persistent access to digital content with a single, and it is not intended as a gambling site.</p>
                        <p>As such all winnings will be capped to the amount spent, and a facility is provided to recalim any spent Nano using the Reclaim button.</p>
                        <ul>
                            <li>Learn more <Link to="/npass"><strong>about nPass Tokens</strong></Link></li>
                            <li>Chrome Web Store: install the <a href="https://chrome.google.com/webstore/detail/npass/oohcmndahocfeiebkkdcbceeaanheafc" target="_blank"> nPass Chrome extension</a></li>
                            <li>nPass extension: Wallet setup <a href="https://github.com/tjl-dev/npass#extension-setup-instructions">instructions</a></li>
                            <li>nPass <a href="https://github.com/tjl-dev/npass">github code repository</a> - component library with example site</li>
                            <li>A brief Introduction to Nano: <a href="https://docs.nano.org/what-is-nano/overview/">https://docs.nano.org/what-is-nano/overview/</a></li>
                            <li>Nano documentation: <a href="https://docs.nano.org/">https://docs.nano.org/</a></li>  
                            <li>Nano wallets: <a href="https://nanolinks.info/#wallets">https://nanolinks.info/#wallets</a></li>
                            <li>Nano faucets - get free nano to play with: <a href="https://nanolinks.info/#faucets-free-nano">https://nanolinks.info/#faucets-free-nano</a></li>
                        </ul>                         
                    </div>  
                    <Table size="sm" style={{textAlign:"left"}}> 
                        <tr>
                            <td>Server Account</td>
                            <td>{serverAddress}</td>
                        </tr>
                        <tr>
                            <td>Contact</td>
                            <td>email: tjldevel@gmail.com</td>
                        </tr>
                    </Table>  
                </Card>
                {/* todo add list of recent games stats */}
            </div>
        );
    }
}

export default NanoBomb;
