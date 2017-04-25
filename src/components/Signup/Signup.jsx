import React, { PureComponent } from 'react';
import logo from '../../assets/images/bookie_logo_signup.png';
import { Form } from 'antd';
import SignupForm from './SignupForm';
import { NavigateActions, RegisterActions } from '../../actions';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { I18n }  from 'react-redux-i18n'

class Signup extends PureComponent {

  constructor(props){
    super(props);
    this.onClickLogin = this.onClickLogin.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  //Navigate to login page
  onClickLogin(event) {
    event.preventDefault();
    this.props.navigateTo('/login')
  }

  //Sign up the user
  handleSubmit(values) {
    this.props.signup(values.get('accountName'), values.get('password'));
  }

  render() {
    return (
      <div className='signupBackground'>
        <div className='registerComponent' >
          <div className='wrapper'>
            <div className='text-center'>
              <img src={ logo } className='logo' width='114px' height='105px' alt=''/>
              <p className='font18 margin-btm-24'>{I18n.t('signup.new_acc_req_text')}</p>
              <div className='center-ele'>
                <SignupForm
                  loadingStatus={ this.props.loadingStatus }
                  onClickLogin={ this.onClickLogin }
                  onSubmit={ this.handleSubmit }
                  errors={ this.props.errors } />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const register = state.get('register');
  return {
    loadingStatus: register.get('loadingStatus'),
    errors: register.get('errors')
  }
}
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    navigateTo: NavigateActions.navigateTo,
    signup: RegisterActions.signup
  }, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(Signup))
