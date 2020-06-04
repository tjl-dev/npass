import React, { Component } from 'react';
import icon from './image/nPass.2.png';
import { Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import TokensDemo from './components/TokensDemo';
import ProtectedDemo from './components/ProtectedDemo';
import Login from './components/Login';
import './App.css';
import 'npass/dist/index.css';

const MY_NANO_ADDRESS = 'nano_3swpttz8t86zywz7xa83wb9ygsq89y71i7eyg9ackeix1nubzng9uj7aw9ha'

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toAddress: MY_NANO_ADDRESS,
      verificationApiKey: '12345',          // not yet used
      verificationApiUser: 'some_username', // not yet used
      verificationApiToken: 'some_token',   // not yet used      
    }
  }

  render() {
    const config = {config: this.state}
    return (
      <div className="App">
        <header className="App-header">
          <div style={{float: "left"}}><a href="/npass"><img src={icon} className="App-icon" alt="icons" /></a> </div>
          <div style={{textAlign: "centre"}}><h3><strong>nPass</strong> <small>[demo]</small></h3><span>- Nano based tokens for content access -</span></div>           
        </header>

        <main>
          <Switch>
              <Route path="/" component={Home} exact />
              <Route path="/npass" component={Home} exact />
              <Route path="/npass/tokens"    render={(props) => <TokensDemo    {...props} {...config} /> } />
              <Route path="/npass/protected" render={(props) => <ProtectedDemo {...props} {...config} /> } />
              <Route path="/npass/login"     render={(props) => <Login         {...props} {...config} /> } />
          </Switch>
      </main>

      <div className="div-center">
        <div className="coinmarketcap-currency-widget"
          data-currencyid="1567"
          data-base="USD"
          data-secondary=""
          data-ticker="true"
          data-rank="false"
          data-marketcap="false"
          data-volume="false"
          data-stats="USD"
          data-statsticker="false">
        </div>
      </div>
    </div>
    );
  }
}

export default App;
