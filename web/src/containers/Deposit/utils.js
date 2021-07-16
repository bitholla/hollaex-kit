import React, { Fragment } from 'react';
import { reduxForm } from 'redux-form';
import QRCode from 'qrcode.react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import STRINGS from '../../config/localizedStrings';
import { EditWrapper, Button } from 'components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { required } from 'components/Form/validations';
import { getNetworkLabelByKey } from 'utils/wallet';

import Image from 'components/Image';
import renderFields from 'components/Form/factoryFields';
import { isMobile } from 'react-device-detect';
import Fiat from './Fiat';

export const generateBaseInformation = (id = '') => (
	<div className="text">
		{id && (
			<p>
				{STRINGS.formatString(STRINGS['DEPOSIT_BANK_REFERENCE'], id).join(' ')}
			</p>
		)}
	</div>
);

export const generateFormFields = ({
	networks,
	address,
	label,
	onCopy,
	copyOnClick,
	destinationAddress,
	destinationLabel,
}) => {
	const fields = {};

	if (networks) {
		const networkOptions = networks.map((network) => ({
			value: network,
			label: getNetworkLabelByKey(network),
		}));

		fields.network = {
			type: 'select',
			stringId:
				'WITHDRAWALS_FORM_NETWORK_LABEL,WITHDRAWALS_FORM_NETWORK_PLACEHOLDER,DEPOSIT_FORM_NETWORK_WARNING',
			label: STRINGS['WITHDRAWALS_FORM_NETWORK_LABEL'],
			placeholder: STRINGS['WITHDRAWALS_FORM_NETWORK_PLACEHOLDER'],
			warning: STRINGS['DEPOSIT_FORM_NETWORK_WARNING'],
			validate: [required],
			fullWidth: true,
			options: networkOptions,
			hideCheck: true,
			ishorizontalfield: true,
			disabled: networks.length === 1,
		};
	}

	if (address) {
		fields.address = {
			type: 'dumb',
			label,
			fullWidth: true,
			allowCopy: true,
			onCopy,
			copyOnClick,
			hideCheck: true,
			ishorizontalfield: true,
		};
	}

	if (destinationAddress) {
		fields.destinationAddress = {
			type: 'dumb',
			label: destinationLabel,
			fullWidth: true,
			allowCopy: true,
			onCopy,
			copyOnClick,
			hideCheck: true,
			ishorizontalfield: true,
		};
	}

	return fields;
};

const RenderContentForm = ({
	titleSection,
	currency,
	coins = {},
	onCopy,
	onOpen,
	setCopied,
	copied,
	address,
	showGenerateButton,
	formFields,
	icons: ICONS,
	selectedNetwork,
}) => {
	const coinObject = coins[currency];
	if (coinObject && !coinObject.meta.is_fiat) {
		return (
			<Fragment>
				<div className="withdraw-form-wrapper">
					<div className="withdraw-form">
						<Image
							iconId={`${currency.toUpperCase()}_ICON`}
							icon={ICONS[`${currency.toUpperCase()}_ICON`]}
							wrapperClassName="form_currency-ball"
						/>
						{titleSection}
						{(currency === 'xrp' ||
							currency === 'xlm' ||
							selectedNetwork === 'xlm') && (
							<div className="d-flex">
								<div className="d-flex align-items-baseline field_warning_wrapper">
									<ExclamationCircleFilled className="field_warning_icon" />
									<div className="field_warning_text">
										{STRINGS['DEPOSIT_FORM_TITLE_WARNING_DESTINATION_TAG']}
									</div>
								</div>
								<EditWrapper stringId="DEPOSIT_FORM_TITLE_WARNING_DESTINATION_TAG" />
							</div>
						)}
						{renderFields(formFields)}
						{address && (
							<div className="deposit_info-qr-wrapper d-flex align-items-center justify-content-center">
								<div className="qr_code-wrapper d-flex flex-column">
									<div className="qr-code-bg d-flex justify-content-center align-items-center">
										<QRCode value={address} />
									</div>
									<div className="qr-text">
										<EditWrapper stringId="DEPOSIT.QR_CODE">
											{STRINGS['DEPOSIT.QR_CODE']}
										</EditWrapper>
									</div>
								</div>
							</div>
						)}
					</div>
					{showGenerateButton && (
						<div className="btn-wrapper">
							<Button
								stringId="GENERATE_WALLET"
								label={STRINGS['GENERATE_WALLET']}
								onClick={onOpen}
							/>
						</div>
					)}
					{isMobile && address && (
						<div className="btn-wrapper">
							<CopyToClipboard text={address} onCopy={setCopied}>
								<Button
									onClick={onCopy}
									label={
										copied ? STRINGS['SUCCESFUL_COPY'] : STRINGS['COPY_ADDRESS']
									}
								/>
							</CopyToClipboard>
						</div>
					)}
				</div>
			</Fragment>
		);
	} else if (coinObject && coinObject.meta.is_fiat) {
		return (
			<Fiat
				id="REMOTE_COMPONENT__FIAT_WALLET_DEPOSIT"
				titleSection={titleSection}
				icons={ICONS}
				currency={currency}
			/>
		);
	} else {
		return <div>{STRINGS['DEPOSIT.NO_DATA']}</div>;
	}
};

export default reduxForm({
	form: 'GenerateWalletForm',
	enableReinitialize: true,
})(RenderContentForm);
