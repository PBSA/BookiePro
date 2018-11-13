/**
 * The Place Bets component contains all the pending bets a user has selected but
 * not yet placed. Its behaviors are almost identical to the Betslip in QuickBetDrawer.
 * The only difference is that this Betslip only contains betslips associated with
 * one sport event so they are all displayed in one {@link BetTable}.
 *
 * The betslips are stored in the Redux store under `marketDrawer`->`unconfirmedBets`.
 */
import React, {PureComponent} from 'react';
import SplitPane from 'react-split-pane';
import {I18n} from 'react-redux-i18n';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Immutable from 'immutable';
import Ps from 'perfect-scrollbar';
import {Button} from 'antd';
import {BetActions, MarketDrawerActions, NavigateActions} from '../../../actions';
import {BettingModuleUtils, CurrencyUtils} from '../../../utility';
import BetTable from '../BetTable';
import './BetSlip.less';
import {Empty, OverlayUtils} from '../Common';
import {BettingDrawerStates, Config} from '../../../constants';
import {MyAccountPageSelector} from '../../../selectors';
import Subtotal from './Subtotal';

const renderContent = (props) => (
  <div className='content' ref='unconfirmedBets'>
    {props.bets.isEmpty() && (
      <Empty
        showSuccess={ props.showBetSlipSuccess }
        className='market_drawer.unconfirmed_bets'
        navigateTo={ props.navigateTo }
      />
    )}
    {!props.bets.isEmpty() && (
      <BetTable
        data={ props.bets }
        title={ I18n.t('market_drawer.unconfirmed_bets.header') }
        deleteOne={ props.deleteUnconfirmedBet }
        deleteMany={ props.clickDeleteUnconfirmedBets }
        updateOne={ props.updateUnconfirmedBet }
        dimmed={ props.obscureContent }
        currencyFormat={ props.currencyFormat }
        oddsFormat={ props.oddsFormat }
        activeTab={ props.activeTab }
        disabled={ props.disabled }
      />
    )}
  </div>
);

class PlaceBet extends PureComponent {
  componentDidMount() {
    Ps.initialize(ReactDOM.findDOMNode(this.refs.unconfirmedBets));
  }

  modifyFooterLocation(isVisibleInDOM, rectParent) {
    // The rectParent needs to have its height adjusted to manipulate the scrollable region of the 
    // betslip tab.
    let footer = document.getElementById('pb-footer');
    let footerClass = footer && footer.className;
    let scrollableDiv = rectParent.children[0];
    let scrollableDivClass = scrollableDiv.className;
    let fCIndex = footerClass && footerClass.indexOf('sticky');
    let sCIndex = scrollableDivClass.indexOf('footer--sticky');

    if (!isVisibleInDOM) {
      // Append the sticky class.
      if (fCIndex === -1) {
        footer.className = footerClass + ' sticky';
      }

      if (sCIndex === -1) {
        scrollableDiv.className = scrollableDivClass + ' footer--sticky';
      }
    } else {
      // Two children down from the rectParent is the div that has a height changing as bets are
      // added or deleted from it. If this child elements height is less than rectParents, we can
      // remove the sticky class from the footer.
      let childOfChild = rectParent.firstElementChild.firstElementChild;
      let cOcHeight = childOfChild.offsetHeight + 160; // To make up for the existance of footer
      let rectParentHeight = rectParent.offsetHeight;

      if (cOcHeight < rectParentHeight) {
        if (fCIndex !== -1) {
          footer.className = footerClass.substring(0, fCIndex - 1);
        }

        if (sCIndex !== -1) {
          scrollableDiv.className = scrollableDivClass.substring(0, sCIndex - 1);
        }
      }
    }
  }

  inViewport(rect, rectParent) {
    let isVisibleInDOM;

    let rectBounding = rect.getBoundingClientRect();
    // Determing if the `rect` is visible with the following checks.
    isVisibleInDOM =
      rectBounding.top >= 0 &&
      rectBounding.left >= 0 &&
      rectBounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rectBounding.right <= (window.innerWidth || document.documentElement.clientWidth);

    this.modifyFooterLocation(isVisibleInDOM, rectParent);
  }
  
  componentDidUpdate() {
    // Get the button element in the footer.
    let rect = document.getElementById('btn--place-bet');

    // If the `rect` exists, we will proceed to get its location in the DOM.
    if (rect) {
      // Determine if the 'rect' is visible within its scrollable element. 'content
      let rectParent = rect.parentElement.parentElement.parentElement.parentElement;

      this.inViewport(rect, rectParent);

      // Add event listener for scrolling/resize on the place bet button parent div. 
      // Just a precaution.
      rectParent.addEventListener('scroll', () => {
        this.inViewport(rect, rectParent);
      });
      // Window event listener for immediate update of footer while resizing.
      window.addEventListener('resize', () => {
        this.inViewport(rect, rectParent);
      });
    }

    Ps.update(ReactDOM.findDOMNode(this.refs.unconfirmedBets));
  }

  render() {
    return (
      <div className='betslip'>
        <SplitPane
          split='horizontal'
          minSize={ 40 }
          defaultSize={ 40 }
          primary='second'
          allowResize={ false }
          pane1Style={ {overflowY: 'hidden'} }
        >
          {renderContent(this.props)}
          {!this.props.bets.isEmpty() && (
            <div 
              className={
                `place-bet-drawer__footer${this.props.obscureContent ? '-dimmed' : ''}`
              }
              id='pb-footer'
            >
              <Subtotal
                betAmount={ this.props.totalBetAmountFloat }
                transactionFee={ this.props.transactionFee }
                currencyFormat={ this.props.currencyFormat }
              />
              <Button
                className={ 'btn place-bet' }
                id={ 'btn--place-bet' }
                onClick={ () => this.props.clickPlaceBet(
                  this.props.totalBetAmountFloat,
                  this.props.currencyFormat
                )
                }
                disabled={ this.props.numberOfGoodBets === 0 }
              >
                {I18n.t('quick_bet_drawer.unconfirmed_bets.content.place_bet_button')}
              </Button>
            </div>
          )}
        </SplitPane>
        {OverlayUtils.render(
          'market_drawer.unconfirmed_bets',
          this.props,
          () => this.props.makeBets(this.props.originalBets),
          () => this.props.deleteUnconfirmedBets(this.props.unconfirmedbetsToBeDeleted)
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const disabled = ownProps.activeTab === 'OPENBETS';
  const originalBets = state.getIn(['marketDrawer', 'unconfirmedBets']);
  let page = Immutable.Map();
  originalBets.forEach((bet) => {
    const betType = bet.get('bet_type');

    // Page content are grouped by market type (back or lay)
    if (!page.has(betType)) {
      page = page.set(betType, Immutable.List());
    }

    // Add the bet to the list of bets with the same market type
    let betListByBetType = page.get(betType);
    betListByBetType = betListByBetType.push(bet);
    // Put everything back in their rightful places
    page = page.set(betType, betListByBetType);
  });

  // Name   : totalAmount Calculation
  // Author : Keegan Francis : k.francis@pbsa.info
  // Ticket : BOOK-430
  // Purpose: totalAmount is calculated by iterating over the bet objects and
  //           taking either the stake (back) or the profit (lay). The result
  //           will be the amount subtracted from your account when a bet is placed.
  const totalAmount = originalBets.reduce((total, bet) => {
    const stake =
      bet.get('bet_type') === 'back'
        ? parseFloat(bet.get('stake'))
        : parseFloat(bet.get('liability'));
    return total + (isNaN(stake) ? 0.0 : stake);
  }, 0.0);
  // Add the transaction fee to the place bet button.
  /*Precision value will affect whether or not the full number will be displayed, 
  regardless of it being added. */
  let transactionFee =
    ownProps.currencyFormat === Config.features.currency ?
      Config.coinTransactionFee :
      Config.mCoinTransactionFee;

  // Add a transaction action fee for each bet.
  transactionFee = originalBets.size * transactionFee;

  // Number of Good bets
  const numberOfGoodBets = originalBets
    .reduce((sum, bet) => sum + (BettingModuleUtils.isValidBet(bet) | 0), 0);
    
  // Overlay
  const overlay = state.getIn(['marketDrawer', 'overlay']);
  const obscureContent =
    overlay !== BettingDrawerStates.NO_OVERLAY &&
    overlay !== BettingDrawerStates.SUBMIT_BETS_SUCCESS;
  const currencyType = CurrencyUtils.getCurrencyType(ownProps.currencyFormat);
  return {
    originalBets,
    bets: page,
    overlay,
    obscureContent,
    unconfirmedbetsToBeDeleted: state.getIn(['marketDrawer', 'unconfirmedbetsToBeDeleted']),
    numberOfGoodBets,
    numberOfBadBets: originalBets.size - numberOfGoodBets,
    totalBetAmountFloat: totalAmount,
    oddsFormat: MyAccountPageSelector.oddsFormatSelector(state),
    currencySymbol: CurrencyUtils.getCurrencySymbol(
      ownProps.currencyFormat,
      numberOfGoodBets === 0 ? 'white' : 'black'
    ),
    totalBetAmountString: CurrencyUtils.toFixed(
      'transaction',
      totalAmount,
      currencyType
    ),
    transactionFee,
    disabled
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators(
  {
    navigateTo: NavigateActions.navigateTo,
    deleteUnconfirmedBet: MarketDrawerActions.deleteUnconfirmedBet,
    clickDeleteUnconfirmedBets: MarketDrawerActions.clickDeleteUnconfirmedBets,
    deleteUnconfirmedBets: MarketDrawerActions.deleteUnconfirmedBets,
    updateUnconfirmedBet: MarketDrawerActions.updateUnconfirmedBet,
    clickPlaceBet: MarketDrawerActions.clickPlaceBet,
    makeBets: BetActions.makeBets,
    hideOverlay: MarketDrawerActions.hideOverlay
  },
  dispatch
);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlaceBet);
