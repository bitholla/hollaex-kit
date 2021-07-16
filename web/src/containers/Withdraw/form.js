import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	reduxForm,
	formValueSelector,
	reset,
	SubmissionError,
	stopSubmit,
	change,
} from 'redux-form';
import math from 'mathjs';
// import classnames from 'classnames';
// import { isMobile } from 'react-device-detect';
import { Button, Dialog, OtpForm, Loader } from '../../components';
import renderFields from '../../components/Form/factoryFields';
import {
	setWithdrawEmailConfirmation,
	setWithdrawNotificationError,
} from './notifications';
import { BASE_CURRENCY } from '../../config/constants';
import { calculateBaseFee } from './utils';
import Fiat from 'containers/Deposit/Fiat';
import Image from 'components/Image';
import STRINGS from '../../config/localizedStrings';

import ReviewModalContent from './ReviewModalContent';

export const FORM_NAME = 'WithdrawCryptocurrencyForm';

const selector = formValueSelector(FORM_NAME);
let errorTimeOut = null;

const validate = (values, props) => {
	const errors = {};
	const amount = math.fraction(values.amount || 0);
	const fee = math.fraction(values.fee || 0);
	const balance = math.fraction(props.balanceAvailable || 0);

	const totalTransaction = math.add(fee, amount);
	if (math.larger(totalTransaction, balance)) {
		errors.amount = STRINGS.formatString(
			STRINGS['WITHDRAWALS_LOWER_BALANCE'],
			math.number(totalTransaction)
		);
	}

	return errors;
};

class Form extends Component {
	state = {
		dialogIsOpen: false,
		dialogOtpOpen: false,
		otp_code: '',
	};

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (nextProps.currency !== this.props.currency) {
			nextProps.dispatch(reset(FORM_NAME));
		}
		if (
			!nextProps.submitting &&
			nextProps.submitting !== this.props.submitting
		) {
			this.onCloseDialog();
		}

		if (
			nextProps.currency === BASE_CURRENCY &&
			(nextProps.data.amount !== this.props.data.amount ||
				(nextProps.currency === BASE_CURRENCY &&
					nextProps.amount !== this.props.currency))
		) {
			const fee = calculateBaseFee(nextProps.data.amount);
			if (fee !== nextProps.data.fee) {
				// nextProps.change('fee', fee);
			}
		}
	}

	componentWillUnmount() {
		if (errorTimeOut) {
			clearTimeout(errorTimeOut);
		}
	}

	onOpenDialog = (ev) => {
		if (ev && ev.preventDefault) {
			ev.preventDefault();
		}
		this.setState({ dialogIsOpen: true });
	};

	onCloseDialog = (ev) => {
		if (ev && ev.preventDefault) {
			ev.preventDefault();
		}
		this.setState({ dialogIsOpen: false, dialogOtpOpen: false });
	};

	onAcceptDialog = () => {
		if (this.props.otp_enabled) {
			this.setState({ dialogOtpOpen: true });
		} else {
			this.onCloseDialog();
			// this.props.submit();
			const values = this.props.data;
			return this.props
				.onSubmitWithdrawReq({
					...values,
					amount: math.eval(values.amount),
					fee: values.fee ? math.eval(values.fee) : 0,
				})
				.then((response) => {
					this.props.onSubmitSuccess(
						{ ...response.data, currency: this.props.currency },
						this.props.dispatch
					);
					return response;
				})
				.catch((err) => {
					const error = { _error: err.message, ...err.errors };
					errorTimeOut = setTimeout(() => {
						this.props.dispatch(change(FORM_NAME, 'captcha', ''));
					}, 5000);
					this.props.onSubmitFail(err.errors || err, this.props.dispatch);
					this.onCloseDialog();
					this.props.dispatch(stopSubmit(FORM_NAME, error));
					// throw new SubmissionError(error);
				});
		}
	};

	onConfirmEmail = () => {
		this.onCloseDialog();
		this.props.router.push('/wallet');
	};

	onSubmitOtp = ({ otp_code = '' }) => {
		const values = this.props.data;
		return this.props
			.onSubmitWithdrawReq({
				...values,
				amount: math.eval(values.amount),
				fee: values.fee ? math.eval(values.fee) : 0,
				otp_code,
			})
			.then((response) => {
				this.onCloseDialog();
				this.props.onSubmitSuccess(
					{ ...response.data, currency: this.props.currency },
					this.props.dispatch
				);
				return response;
			})
			.catch((err) => {
				if (err instanceof SubmissionError) {
					if (err.errors && !err.errors.otp_code) {
						const error = { _error: err.message, ...err.errors };
						errorTimeOut = setTimeout(() => {
							this.props.dispatch(change(FORM_NAME, 'captcha', ''));
						}, 5000);
						this.props.onSubmitFail(err.errors, this.props.dispatch);
						this.onCloseDialog();
						this.props.dispatch(stopSubmit(FORM_NAME, error));
					}
					throw err;
				} else {
					const error = { _error: err.message };
					errorTimeOut = setTimeout(() => {
						this.props.dispatch(change(FORM_NAME, 'captcha', ''));
					}, 5000);
					this.props.onSubmitFail(error, this.props.dispatch);
					this.onCloseDialog();
					this.props.dispatch(stopSubmit(FORM_NAME, error));
					throw new SubmissionError(error);
				}
			});
	};

	render() {
		const {
			submitting,
			pristine,
			error,
			valid,
			// initialValues, // eslint-disable-line
			currency,
			data,
			openContactForm,
			formValues,
			currentPrice,
			activeTheme,
			coins,
			titleSection,
			icons: ICONS,
			selectedNetwork,
		} = this.props;

		const { dialogIsOpen, dialogOtpOpen } = this.state;
		const hasDestinationTag =
			currency === 'xrp' || currency === 'xlm' || selectedNetwork === 'xlm';

		const coinObject = coins[currency];
		if (coinObject && !coinObject.meta.is_fiat) {
			return (
				<form autoComplete="off" className="withdraw-form-wrapper">
					<div className="withdraw-form">
						<Image
							iconId={`${currency.toUpperCase()}_ICON`}
							icon={ICONS[`${currency.toUpperCase()}_ICON`]}
							wrapperClassName="form_currency-ball"
						/>
						{titleSection}
						{renderFields(formValues)}
						{error && <div className="warning_text">{error}</div>}
					</div>
					<div className="btn-wrapper">
						<Button
							label={STRINGS['WITHDRAWALS_BUTTON_TEXT']}
							disabled={pristine || submitting || !valid}
							onClick={this.onOpenDialog}
							className="mb-3"
						/>
					</div>
					<Dialog
						isOpen={dialogIsOpen}
						label="withdraw-modal"
						onCloseDialog={this.onCloseDialog}
						shouldCloseOnOverlayClick={dialogOtpOpen}
						theme={activeTheme}
						showCloseText={false}
					>
						{dialogOtpOpen ? (
							<OtpForm
								onSubmit={this.onSubmitOtp}
								onClickHelp={openContactForm}
							/>
						) : !submitting ? (
							<ReviewModalContent
								coins={coins}
								currency={currency}
								data={data}
								price={currentPrice}
								onClickAccept={this.onAcceptDialog}
								onClickCancel={this.onCloseDialog}
								hasDestinationTag={hasDestinationTag}
							/>
						) : (
							<Loader relative={true} background={false} />
						)}
					</Dialog>
				</form>
			);
		} else if (coinObject && coinObject.meta.is_fiat) {
			return (
				<Fiat
					id="REMOTE_COMPONENT__FIAT_WALLET_WITHDRAW"
					icons={ICONS}
					titleSection={titleSection}
					currency={currency}
				/>
			);
		} else {
			return <div>{STRINGS['DEPOSIT.NO_DATA']}</div>;
		}
	}
}

const WithdrawForm = reduxForm({
	form: FORM_NAME,
	onSubmitFail: setWithdrawNotificationError,
	onSubmitSuccess: (data, dispatch) => {
		dispatch(reset(FORM_NAME));
		setWithdrawEmailConfirmation(data, dispatch);
	},
	enableReinitialize: true,
	validate,
})(Form);

const mapStateToForm = (state) => ({
	data: selector(
		state,
		'network',
		'address',
		'destination_tag',
		'amount',
		'fee',
		'captcha'
	),
	activeTheme: state.app.theme,
	coins: state.app.coins,
});

const WithdrawFormWithValues = connect(mapStateToForm)(WithdrawForm);

export default WithdrawFormWithValues;
