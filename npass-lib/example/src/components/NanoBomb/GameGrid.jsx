import React, { Component } from 'react';
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast'
import GameCard from './GameCard';
import nanoIcon from '../../image/nano.icon.png';
import './../../App.css';
import 'npass/dist/index.css';

class GameGrid extends Component {
    constructor(props) {
        super(props);
        this.generateCards = this.generateCards.bind(this);
        this.fetchState = this.fetchState.bind(this);
        this.claimWin = this.claimWin.bind(this);
        this.reclaimSpent = this.reclaimSpent.bind(this);        
        this.state = {rows: {}, session: {}}
    }

    async componentDidMount() {
        this.generateCards()
        this.fetchState()
    }

    generateCards() {        
        const session = this.state.session || {}
        const gameState = session.state || ""
        const active = gameState == "ACTIVE"
        const cards = session.cards || {}
        
        console.log('generating ' + (active? 'active' : 'inactive') + ' cards for session ', this.props.sessionId)        
        var rows = new Array(5);
        for (var i = 0; i < 5; i++) {
            var cols = new Array(5);
            for (var j = 0; j < 5; j++) {
                const cardId = i*5 + j
                const cardData = cards.length > cardId? cards[cardId] : {}
                cols[j] =   <td>
                                <GameCard 
                                    sessionId={this.props.sessionId} 
                                    cardId={cardId} 
                                    cardData={cardData}
                                    address={this.props.address} 
                                    cardPrice={this.props.cardPrice}
                                    fetchState={this.fetchState} 
                                    active={active}
                                />
                            </td>
            }
            rows[i] = <tr>
                        {cols}
                      </tr>
        }
        this.setState( {rows} ) 
    }

    async fetchState() {       
        try {
            const sessionResponse = await fetch(`/npass/nanobomb/game/` + this.props.sessionId)
            if (!sessionResponse.ok) 
                throw Error(sessionResponse.statusText)

            let that = this
            sessionResponse.json().then(function(session) {
                console.log('Session State: ', session)
                that.setState({session})        
                that.generateCards()        
            })    
        } catch (error) {
            console.log('Failed to load session state for ' + this.props.sessionId)
        }
    }

    async claimWin() {
        try {            
            const session = this.state.session || {}
            const spent = session.spent || 0
            const playerAddress = session.playerAddress || 0

            const claimGameResponse = await fetch(`/npass/nanobomb/game/claim/` + this.props.sessionId)
            if (!claimGameResponse.ok) 
                throw Error(claimGameResponse.statusText)

            let that = this
            claimGameResponse.json().then(function(summary) { 
                console.log('Claim Game Result: ', summary)
                that.setState({result: summary.result, session: summary})
                that.generateCards()   
            })    
        } catch (error) {
            console.log('Failed to claim game: ', error)
        }
    }

    async reclaimSpent() {
        try {
            const session = this.state.session || {}
            const spent = session.spent || 0
            const playerAddress = session.playerAddress || 0

            const msg = `NOTE: THis will finalize the game session and send back the amount spent to the nominated address.\n\n`
                + `  Reclaim Spent: ${spent} nano\n`
                + `  To Address: ${playerAddress} \n\n`
                + `\n\nPress OK to continue, otherwise press cancel.\n\n`;
            
            //eslint-disable-next-line
            if(!confirm(msg))
                return;    

            const reclaimGameResponse = await fetch(`/npass/nanobomb/game/reclaim/` + this.props.sessionId)
            if (!reclaimGameResponse.ok) 
                throw Error(reclaimGameResponse.statusText)

            let that = this
            reclaimGameResponse.json().then(function(summary) { 
                console.log('Reclaim Game Result: ', summary)
                that.setState({result: summary.result, session: summary})
                that.generateCards()   
            })    
        } catch (error) {
            console.log('Failed to reclaim: ', error)
        }
    }

    async newGame(playerAddress) {
        const session = this.state.session || {}
        const gameState = session.state || "ERROR"
        if(gameState == "ACTIVE") {
            const abandonGameResponse = await fetch(`/npass/nanobomb/game/abandon/` + this.props.sessionId)
            if (!abandonGameResponse.ok) 
                throw Error(abandonGameResponse.statusText)

            let that = this
            abandonGameResponse.json().then(function(summary) { 
                console.log('Abandon Game Result: ', summary)
                that.setState({result: summary.result, session: summary})
                that.generateCards()   
            })   

        }
        this.props.newGame(playerAddress)
    }

    render() {
        const rows = this.state.rows || false
        const session = this.state.session || {}
        const playerAddress = session.playerAddress || ''
        const numHearts = session.hearts || 0
        const numBombs = session.bombs || 0
        const numCoins = session.coins || 0
        const tally = +(session.tally || 0).toFixed(4)
        const spent = +(session.spent || 0).toFixed(4)
        const jackpotAmount = +(session.jackpot || 0).toFixed(4)
        const result = this.state.session.result || {}
        const claimedAmount = +(result.paymentAmount || 0).toFixed(4)
        const hash = session.cardDistributionHash || ""

        const gameState = session.state || "ERROR"
        const isActive = gameState == "ACTIVE"
        const isClaimed = gameState == "CLAIMED" || gameState == "RECLAIMED"
        const isJackpot = gameState == "JACKPOT"

        const nanobomb=<img src="/npass/nanobomb/preview/nanobomb.png" height="60px" width="60px"></img>
        const bomb=<img src="/npass/nanobomb/preview/BOMB.png" height="50px" width="50px"></img>
        const heart=<img src="/npass/nanobomb/preview/HEART.png" height="50px" width="50px"></img>        
        const nanocoin=<img src="/npass/nanobomb/preview/NANOCOIN.png" height="50px" width="50px"></img>
        const jackpot=<img src="/npass/nanobomb/preview/COLIN.png" height="50px" width="50px"></img>
        const bomber=<img src="/npass/nanobomb/preview/BOMBER.png" height="50px" width="50px"></img>
        const nano = <img src={nanoIcon} style={{width:"40px"}} alt="nano"/>

        const bombs = numBombs > 0 ? Array.from(Array(numBombs), (_,x) => bomb) : null
        const hearts = numHearts > 0 ? Array.from(Array(numHearts), (_,x) => heart) : null
        const nanocoins = numCoins > 0 ? Array.from(Array(numCoins), (_,x) => nanocoin) : null
        const claim = <Button disabled={(!isActive && !isJackpot) || tally <= 0} onClick={() => this.claimWin()} style={{width: "85px"}}>Claim</Button>
        const reclaim = <Button disabled={isClaimed || spent <= 0} onClick={() => this.reclaimSpent()} style={{width: "85px"}}>Reclaim</Button>
        const newGame = <Button onClick={() => this.newGame(playerAddress)} style={{width: "200px"}} >New Game</Button>

        const toastStyle = {
            width: "800px",
            maxWidth: "800px",
            position: "fixed",
            top: "50%",
            left: "50%",
            marginTop: "-100px", /* Negative half of height. */
            marginLeft: "-400px", /* Negative half of width. */
            zIndex: "1",
        }
        return (
            <div className="div-center" style={{width: "800px"}}> 
                <div className="div-center" style={{width: "400px"}}> 
                    <Table hover size="sm" style={{textAlign:"left"}}>    
                        <tr>
                            <td>Current Jackpot</td>
                            <td>{jackpotAmount}{nano}</td>
                        </tr>
                        <tr>
                            <td>Card Price</td>
                            <td>{this.props.cardPrice}{nano}</td>
                        </tr>
                    </Table> 
                </div>
                <div className="div-center"> 
                    <Toast show={!isActive} style={toastStyle}>
                        <Toast.Body style={{ padding: "5px" }}>
                            {gameState == "DEAD" && 
                                <div style={{margin:"10px"}}>
                                    <h2 style={{color: "crimson"}}>{nanobomb}{nanobomb}{nanobomb} GAME OVER! {nanobomb}{nanobomb}{nanobomb}</h2>         
                                    <h6 style={{color: "crimson"}}>Spent: {spent} {reclaim} </h6><br/>
                                    {newGame}
                                </div>
                            }
                            { gameState == "HACKED"  && 
                                <div style={{margin:"10px"}}>
                                    <h2 style={{color: "crimson"}}>{bomber}{bomber}{bomber} HACKED! {bomber}{bomber}{bomber}</h2>   
                                    <h4 style={{color: "crimson"}}>You have suffered a stolen</h4>      
                                    <h6 style={{color: "crimson"}}>Spent: {spent} {reclaim} </h6><br/>
                                    {newGame}
                                </div>
                            }
                            { gameState == "ABANDONED"  && 
                                <div style={{margin:"10px"}}>
                                    <h2 style={{color: "grey"}}>{nanobomb}{nanocoin}{nanobomb} ABANDONED {nanobomb}{nanocoin}{nanobomb}</h2>   
                                    <h6 style={{color: "grey"}}>Spent: {spent} {reclaim} </h6><br/>
                                    {newGame}
                                </div>
                            }
                            { gameState == "JACKPOT" && 
                                <div style={{margin:"10px"}}>
                                    <h2 style={{color: "green"}}>{jackpot}{jackpot}{jackpot} JACKPOT! {jackpot}{jackpot}{jackpot}</h2>
                                    <Table hover size="sm" style={{width: "300px", display: "inline-table"}}>
                                        <tr>
                                            <td><h6 style={{color: "green"}}>You win: {tally}</h6></td>
                                            <td>{claim}</td>
                                        </tr> 
                                        <tr> 
                                            <td><h6 style={{color: "green"}}>Spent: {spent}</h6></td>
                                            <td> {reclaim}</td>
                                        </tr>    
                                        <tr> 
                                            <td colSpan="2">{newGame}</td>
                                        </tr> 
                                    </Table>                             
                                </div>
                            }
                            { (gameState == "CLAIMED" || gameState == "RECLAIMED") && 
                            <div style={{margin:"10px"}}>
                                <h2 style={{color: "green"}}>{nanocoin}{nanocoin}{nanocoin} - GAME COMPLETE - {nanocoin}{nanocoin}{nanocoin}</h2>
                                <h4 style={{color: "green"}}>{gameState}: {claimedAmount}</h4>
                                {newGame}
                            </div>
                        }
                        </Toast.Body>
                    </Toast>
                </div>
                <div className="div-center"> 
                    {rows.length > 0 &&                    
                        <table>
                            <tbody>                
                                {rows}     
                            </tbody>
                        </table>
                    }    
                </div>
                <div className="div-center"> 
                    <Table borderless size="sm" style={{maxWidth: "700px"}}>
                        <tr>
                            <td>{bombs}{hearts}{nanocoins}</td>
                        </tr>
                        <tr>
                            <td  style={{textAlign:"left"}}></td>
                        </tr>
                    </Table> 
                </div>            
                <Table hover size="sm">
                    <tr>
                        <td style={{fontSize:"2rem", fontWeight: "300", width:"250px"}}>Spent: {spent}{nano}{reclaim}</td>
                        <td style={{fontSize:"2rem", fontWeight: "300", width:"250px"}}>Win: {tally}{nano}{claim}</td>
                    </tr>    
                </Table>    
                <Table hover size="sm">   
                    <tr>
                        <td>Session ID</td>
                        <td>{this.props.sessionId}</td>
                    </tr>  
                    <tr>
                        <td>Card Distribution Hash</td>
                        <td>{hash}</td>
                    </tr> 
                    <tr>
                        <td>Player Address</td>
                        <td>{playerAddress}</td>
                    </tr> 
                    <tr>
                        <td colSpan="2">{newGame}</td>
                    </tr>
                </Table>     
                {Object.keys(result).length > 0 && 
                    <div style={{margin:"20px"}}>
                        <h4>Result</h4>
                        <Table bordered size="sm" style={{margin:"20px"}}>    
                                <tr>
                                    <td>Payment Amount</td>
                                    <td>{result.paymentAmount}</td>
                                </tr>  
                                <tr>
                                    <td>Payment Address</td>
                                    <td>{result.playerAddress}</td>
                                </tr>  
                                <tr>
                                    <td>Payment Block</td>
                                    <td>{result.blockHash}</td>
                                </tr>      
                                <tr>
                                    <td>Card Distribution</td>
                                    <td>
                                        <p>Take the MD5 Hash of this string to verify initial card distribution:</p>
                                        <textarea rows="5" cols="50" readonly>{result.cardDistribution}</textarea>
                                    </td>
                                </tr>     
                        </Table> 
                    </div>
                }                
            </div>
        );
    }
}

export default GameGrid;
