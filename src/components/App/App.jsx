import React, { Component } from 'react';
import SyncError from '../SyncError';
import { ChainStore } from 'graphenejs-lib';
import { SoftwareUpdateActions } from '../../actions';
import { NavigateActions } from '../../actions';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button } from 'antd';

// NOTE ====================================  ALERT  ====================================
// NOTE { THIS CODE WILL BREAK WHEN RUNNING IN BROWSER / ENDPOINT IS LOCALHOST
// NOTE we could only get the version number from package.json in PACKED ELECTRON APP}
// NOTE
// NOTE uncomment it when we are about to publish packed electron app
// NOTE
// NOTE ref: https://github.com/electron/electron/issues/7085
// NOTE ====================================  ALERT  ====================================
// const electron = window.require('electron');
// const { app } = electron.remote

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      synced: false,
      syncFail: false,
      loading: false,
      testingUpdate: true,

      newVersionModalVisible: false,

      currentVersion: "1.1.1a" // hardcode for testing hardupdate/softupdate
    }
    this.syncWithBlockchain = this.syncWithBlockchain.bind(this);
  }

  componentDidMount() {

    // NOTE uncomment it when we are about to publish packed electron app. for details, pls refer to the alert note on top.
    // this.setState({ currentVersion: app.getVersion() });

    this.syncWithBlockchain();
  }
  componentDidUpdate(prevProps, prevState){

    //when blockchain sync is done ( and success)
    if ( this.state.synced && prevState.synced === false){

      //TODO uncomment when we enforce 'loginined is required IN EVERY ROUTE'
      // if ( this.state.isLoggedIn){
      //   this.props.navigateTo('/exchange');
      // } else {
      //   this.props.navigateTo('/login');
      // }

    }
  }

  syncWithBlockchain() {
    this.setState({ loading: true });
    ChainStore.init().then(() => {
      this.setState({
        synced: true,
        loading: false,
        syncFail: false});
      // Listen to software update
      this.props.listenToSoftwareUpdate();
    }).catch((error) => {
      console.error('ChainStore.init error', error);
      this.setState({
        loading: false,
        synced: false,
        syncFail: true});
    });
  }

  render() {
    let content = (
        <div className='sportsbg' id='main-content'>
        </div>
    );

    if (this.state.syncFail) {
      content = (
        <div className='sportsbg' id='main-content'>
          <SyncError/>
        </div> );
    } else if (this.state.loading) {
      content = (
        <div className='sportsbg' id='main-content'>
          <span>loading...connecitng to blockchain</span>
        </div> );
    } else if ( this.props.children ) {
      content = ( this.props.children );
    }

    return content;
  }
}

const mapStateToProps = (state) => {
  const { app } = state;
  return {
    isLoggedIn: app.isLoggedIn,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    navigateTo: NavigateActions.navigateTo,
    listenToSoftwareUpdate: SoftwareUpdateActions.listenToSoftwareUpdate
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
