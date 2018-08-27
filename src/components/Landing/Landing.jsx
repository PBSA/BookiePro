import React, {PureComponent} from 'react';
import PrivacyModal from '../Modal/PrivacyModal';
import {I18n} from 'react-redux-i18n';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {NavigateActions, AppActions} from '../../actions';
import logo from '../../assets/images/bookie_logo_signup.png';
import {AppBackgroundTypes, Config} from '../../constants';
import LandingSteps from './LandingSteps';
import FloatingHelp from '../FloatingHelp';

class Landing extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      privacyModalVisible: false
    };
    this.onLoginClick = this.onLoginClick.bind(this);
    this.onSignupClick = this.onSignupClick.bind(this);
    this.onPrivacyModalCancelClick = this.onPrivacyModalCancelClick.bind(this);
    this.onPrivacyPolicyClick = this.onPrivacyPolicyClick.bind(this);
    this.renderSteps = this.renderSteps.bind(this);
  }

  componentDidMount() {
    // Set app background to sports bg
    this.props.setAppBackground(AppBackgroundTypes.FIELD_BG);
  }

  componentWillUnmount() {
    // Reset app background to gradient
    this.props.setAppBackground(AppBackgroundTypes.GRADIENT_BG);
  }

  onLoginClick(event) {
    event.preventDefault();
    this.props.navigateTo('/login');
  }

  onSignupClick(event) {
    event.preventDefault();
    this.props.navigateTo('/signup');
  }

  onPrivacyPolicyClick(event) {
    event.preventDefault();
    this.setState({
      privacyModalVisible: true
    });
  }

  onPrivacyModalCancelClick() {
    this.setState({
      privacyModalVisible: false
    });
  }

  renderSteps() {
    return <div className='steps' />;
  }

  render() {
    return (
      <div className='landing'>
        <div className='content'>
          <img className='logo' src={ logo } alt='' />
          <div className='slogan'>{I18n.t('landing.slogan')}</div>
          <div className='intro'>{I18n.t('landing.intro')}</div>
          <button className='btn btn-transparent is-blue-border' onClick={ this.onSignupClick }>
            {I18n.t('landing.signup')}
          </button>
          <button className='btn btn-transparent' onClick={ this.onLoginClick }>
            {I18n.t('landing.login')}
          </button>
          <LandingSteps className='steps' depositsEnabled={ this.props.depositsEnabled } />
        </div>
        <div className='footer'>
          <a className='copyright'>{I18n.t('landing.copyright')}</a>
          <span className='separator'> | </span>
          <a className='privacy-policy' onClick={ this.onPrivacyPolicyClick }>
            {I18n.t('landing.privacy_policy')}
          </a>
        </div>
        <FloatingHelp />
        <PrivacyModal
          visible={ this.state.privacyModalVisible }
          onCancelClick={ this.onPrivacyModalCancelClick }
        />
      </div>
    );
  }
}
Landing.defaultProps = {
  depositsEnabled: Config.features.deposits
};

const mapDispatchToProps = (dispatch) => bindActionCreators(
  {
    navigateTo: NavigateActions.navigateTo,
    setAppBackground: AppActions.setAppBackgroundAction
    // Manual Feature Overrides
    /*depositsEnabled: true*/
  },
  dispatch
);

export default connect(
  null,
  mapDispatchToProps
)(Landing);
