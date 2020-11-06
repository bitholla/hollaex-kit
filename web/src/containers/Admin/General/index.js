import React, { Component } from 'react';
import { Button, Modal, message } from 'antd';
import { connect } from 'react-redux';

import FooterConfig from './FooterConfig';
import Description from './Description';
import InterfaceForm from './InterfaceForm';
import { EmailSettingsForm } from '../Settings/SettingsForm';
import { AdminHocForm } from '../../../components';
import Image from '../../../components/Image';
import withConfig from '../../../components/ConfigProvider/withConfig';
import { requestAdminData } from '../../../actions/appActions';
import { upload, updateConstants } from './action';
import { getGeneralFields } from './utils';

import './index.css';

const NameForm = AdminHocForm('NameForm');
const LanguageForm = AdminHocForm('LanguageForm');
const ThemeForm = AdminHocForm('ThemeForm');
const NativeCurrencyForm = AdminHocForm('NativeCurrencyForm');
const HelpDeskForm = AdminHocForm('HelpDeskForm');

class General extends Component {
	constructor() {
		super();
		this.state = {
			constants: {},
			currentIcon: {},
			uploads: {},
			initialNameValues: {},
			initialLanguageValues: {},
			initialThemeValues: {},
			initialEmailValues: {},
			initialLinkValues: {}
		};
	}

	componentDidMount() {
		this.requestInitial();
	}

	componentDidUpdate(prevProps, prevState) {
		if (JSON.stringify(prevState.constants) !== JSON.stringify(this.state.constants)) {
			this.getSettingsValues();
		}
	}

	requestInitial = () => {
		requestAdminData()
			.then((res) => {
				this.setState({ constants: res.data });
			})
			.catch((err) => {
				console.log('err', err);
			})
	}

	getSettingsValues = () => {
		let initialNameValues = { ...this.state.initialNameValues };
		let initialLanguageValues = { ...this.state.initialLanguageValues };
		let initialThemeValues = { ...this.state.initialThemeValues };
		const {
			kit = {},
			secrets = { smtp: {}, captcha: {}, emails: {} },
		} = this.state.constants || {};
		const { api_name, defaults = {}, links = {} } = kit;
		initialNameValues = { ...initialNameValues, api_name };
		initialLanguageValues = { ...initialLanguageValues, language: defaults.language };
		initialThemeValues = { ...initialThemeValues, theme: defaults.theme };

		const { configuration = {}, } = this.state.initialEmailValues || {};
		const initialEmailValues = {
			configuration: { ...configuration, ...secrets.emails, ...secrets.smtp },
			distribution: { ...secrets.emails }
		};
		delete initialEmailValues.configuration.audit;
		const initialLinkValues = { ...links };
		this.setState({
			initialNameValues,
			initialLanguageValues,
			initialThemeValues,
			initialEmailValues,
			initialLinkValues
		});
	};

	handleSaveIcon = async () => {
		const { currentIcon } = this.state;
		const { updateIcons } = this.props;
		const icons = {};
		this.setState({
			loading: true,
		});

		for (const key in currentIcon) {
			if (currentIcon.hasOwnProperty(key)) {
				const file = currentIcon[key];
				if (file) {
					const formData = new FormData();
					const { name: fileName } = file;
					const extension = fileName.split('.').pop();
					const name = `${key}.${extension}`
					formData.append('name', name);
					formData.append('file', file);
					try {
						const { data: { path } } = await upload(formData)
						icons[key] = path;
						this.setState({ currentIcon: {} });
					} catch (error) {
						this.setState({
							loading: false,
						});
						message.error("Something went wrong!");
						return;
					}
				}
			}
		}
		this.setState({
			loading: false
		});
		updateIcons(icons);
	};

	handleCancelIcon = () => {
		this.setState({ currentIcon: {} });
	};

	handleChangeFile = (event) => {
		if (event.target.files) {
			this.setState({
				currentIcon: {
					...this.state.currentIcon,
					[event.target.name]: event.target.files[0]
				}
			}, () => {
				Modal.confirm({
					content: 'Do you want to save this icon?',
					okText: 'Save',
					cancelText: 'Cancel',
					onOk: this.handleSaveIcon,
					onCancel: this.handleCancelIcon
				})
			});
		}
	};

	handleSubmitGeneral = (formProps) => {
		updateConstants(formProps)
			.then((res) => {
				this.setState({ constants: res });
				message.success('Updated successfully');
			})
			.catch(err => {
				let error = err && err.data
					? err.data.message
					: err.message;
				message.error(error);
			})
	};

	handleSubmitName = (formProps) => {
		this.handleSubmitGeneral({ kit: { ...formProps } });
	};

	handleSubmitDefault = (formProps) => {
		this.handleSubmitGeneral({
			kit: {
				defaults: { ...formProps }
			}
		});
	};

	submitSettings = (formProps, formKey) => {
		const { initialEmailValues } = this.state;
		let formValues = {};
		if (formKey === 'email_distribution') {
			formValues = {};
			if (formProps.audit) {
				formValues.secrets = {
					emails: {
						audit: formProps.audit
					}
				}
			}
		} else if (formKey === 'email_configuration') {
			formValues = {};
			let compareValues = initialEmailValues.configuration || {};
			Object.keys(formProps).forEach((val) => {
				if (val === 'sender' || val === 'timezone' || val === 'send_email_to_support') {
					if (compareValues[val] !== formProps[val]) {
						if (!formValues.secrets) formValues.secrets = {};
						if (!formValues.secrets.emails) formValues.secrets.emails = {};
						formValues.secrets.emails[val] = formProps[val];
					}
				} else if (val === 'port') {
					if (compareValues[val] !== parseInt(formProps[val], 10)) {
						if (!formValues.secrets) formValues.secrets = {};
						if (!formValues.secrets.smtp) formValues.secrets.smtp = {};
						formValues.secrets.smtp[val] = parseInt(formProps[val], 10);
					}
				} else {
					if (compareValues[val] !== formProps[val]) {
						if (!formValues.secrets) formValues.secrets = {};
						if (!formValues.secrets.smtp) formValues.secrets.smtp = {};
						if (val === 'password') {
							if (!formProps[val].includes('*')) {
								formValues.secrets.smtp[val] = formProps[val];
							}
						} else {
							formValues.secrets.smtp[val] = formProps[val];
						}
					}
				}
			});
		} else if (formKey === 'links') {
			formValues.kit = {
				links: { ...formProps }
			};
		}
		if (!Object.keys(formValues).length) {
			this.setState({ error: 'Remove masked values from the secrets fields' });
			return false;
		}
		this.handleSubmitGeneral(formValues);
	};
	
	handleSubmitHelpDesk = (formProps) => {
		this.handleSubmitGeneral({
			kit: {
				links: {
					...formProps
				}
			}
		});
	};

	renderImageUpload = (name, label) => {
		const { icons } = this.props;
		return (
			<div className="file-container">
				<div className="file-img-content">
					<Image
						icon={icons[name]}
						wrapperClassName='icon-img'
					/>
				</div>
				<label>
					{label ? <p>{label}</p> : null}
					<span className="anchor">Upload</span>
					<input
						type="file"
						accept="image/*"
						onChange={this.handleChangeFile}
						name={name}
					/>
				</label>
			</div>
		);
	};

	handleSaveInterface = (type) => {
		this.handleSubmitGeneral({
			kit: {
				interface: {
					type
				}
			}
		});
	};

	render() {
		const {
			initialEmailValues,
			initialNameValues,
			initialLanguageValues,
			initialThemeValues,
			initialLinkValues
		} = this.state;
		const { kit = {} } = this.state.constants;
		const { coins } = this.props;
		const generalFields = getGeneralFields(coins);
		return (
			<div>
				<div className='general-wrapper'>
					<div>
						<div className='sub-title'>Exchange Name</div>
						<NameForm
							initialValues={initialNameValues}
							onSubmit={this.handleSubmitName}
							buttonText={'Save'}
							buttonClass="green-btn minimal-btn"
							fields={generalFields.section_1}
						/>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Language</div>
						<div className='description'>
							You can edit language and strings{' '}
							<span className='general-edit-link'>here</span>.
						</div>
						<span className='general-edit-link general-edit-link-position'>Edit</span>
						<LanguageForm
							initialValues={initialLanguageValues}
							onSubmit={this.handleSubmitDefault}
							buttonText={'Save'}
							buttonClass="green-btn minimal-btn"
							fields={generalFields.section_2}
						/>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Theme</div>
						<div className='description'>
							You can edit theme and create new themes{' '}
							<span className='general-edit-link'>here</span>.
						</div>
						<span className='general-edit-link general-edit-link-position'>Edit</span>
						<ThemeForm
							initialValues={initialThemeValues}
							onSubmit={this.handleSubmitDefault}
							buttonText={'Save'}
							buttonClass="green-btn minimal-btn"
							fields={generalFields.section_3}
						/>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Native currency</div>
						<div className='description'>
							This currency unit will be used for valuing deposits/withdrawals and
							other important areas.
						</div>
						<div className='coins-list'>
							<NativeCurrencyForm
								initialValues={{
									native_currency: kit.native_currency
								}}
								onSubmit={this.handleSubmitName}
								buttonText={'Save'}
								buttonClass="green-btn minimal-btn"
								fields={generalFields.section_4}
							/>
						</div>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Exchange logo</div>
						<div className='description'>
							This logo will be applied to emails send to your users and login
							screen, footer and other places. Any custom graphics uploaded via
							the direct edit function will override the logo.
						</div>
						<div className='file-wrapper'>
							{this.renderImageUpload('EXCHANGE_LOGO_LIGHT', 'Light theme')}
							{this.renderImageUpload('EXCHANGE_LOGO_DARK', 'Dark theme')}
						</div>
						<Button type="primary" className="green-btn minimal-btn">Save</Button>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Loader</div>
						<div className='description'>
							Used for areas that require loading.Also known as a spinner.
						</div>
						<div className='file-wrapper'>
							{this.renderImageUpload('LOADER_LIGHT', 'Light theme')}
							{this.renderImageUpload('LOADER_DARK', 'Dark theme')}
						</div>
						<Button type="primary" className="green-btn minimal-btn">Save</Button>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Exchange favicon</div>
						<div className='file-wrapper'>
							{this.renderImageUpload('FAV_ICON')}
						</div>
						<Button type="primary" className="green-btn minimal-btn">Save</Button>
					</div>
					<div className='divider'></div>
					<div>
						<div className='sub-title'>Onboarding background image</div>
						<div className='file-wrapper'>
							{this.renderImageUpload('BOARDING_IMAGE_LIGHT', 'Light theme')}
							{this.renderImageUpload('BOARDING_IMAGE_DARK', 'Dark theme')}
						</div>
						<Button type="primary" className="green-btn minimal-btn">Save</Button>
					</div>
					<div className='divider'></div>
					<div>
						<div className='form-wrapper'>
							<EmailSettingsForm
								initialValues={initialEmailValues}
								handleSubmitSettings={this.submitSettings}
							/>
						</div>
					</div>
					<div className='divider'></div>
					<Description
						descriptionFields={generalFields.section_5}
						descriptionInitialValues={{ description: kit.description }}
						footerFields={generalFields.section_6}
						footerInitialValues={{ description: kit.footer_description }}
						handleSubmitDescription={this.handleSubmitName}
					/>
					<div className='divider'></div>
				</div>
				<div>
					<FooterConfig initialValues={initialLinkValues} handleSubmitFooter={this.submitSettings} />
				</div>
				<div className='divider'></div>
				<div className="general-wrapper">
					<div className='sub-title'>Helpdesk link</div>
					<div className='description'>
						This link will be used for your any help sections on your exchange.
						You can put a direct link to your helpdesk service or your support
						email address.
					</div>
					<HelpDeskForm
						initialValues={{
							helpdesk: initialLinkValues.helpdesk
						}}
						fields={generalFields.section_7}
						buttonText="Save"
						buttonClass="green-btn minimal-btn"
						onSubmit={this.handleSubmitHelpDesk}
					/>
				</div>
				<div className='divider'></div>
				<InterfaceForm
					initialValues={kit.interface}
					handleSaveInterface={this.handleSaveInterface}
				/>
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	coins: state.app.coins,
	user: state.user,
	constants: state.app.constants
});

export default connect(mapStateToProps)(withConfig(General));