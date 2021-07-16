import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadReCaptcha } from 'react-recaptcha-v3';
import { getIconByKey, generateAllIcons, addDefaultLogo } from 'utils/icon';
import { calculateThemes } from 'utils/color';
import merge from 'lodash.merge';
import { DEFAULT_CAPTCHA_SITEKEY } from 'config/constants';

export const ProjectConfig = React.createContext('appConfig');

class ConfigProvider extends Component {
	constructor(props) {
		super(props);
		const { initialConfig, plugins } = this.props;
		const {
			icons = {},
			color = {},
			defaults = {},
			coin_icons,
			sections = {},
		} = {
			...initialConfig,
		};

		const defaultLogo = localStorage.getItem('default_logo') || '';
		const themeOptions = Object.keys(color).map((value) => ({ value }));
		const calculatedThemes = calculateThemes(color);

		this.state = {
			icons: generateAllIcons(
				calculatedThemes,
				addDefaultLogo(defaultLogo, icons),
				coin_icons,
				plugins
			),
			color: calculatedThemes,
			themeOptions,
			defaults,
			sections,
		};
	}

	componentDidMount() {
		const {
			initialConfig: { captcha = {} },
		} = this.props;

		// ReCaptcha Initialization
		const siteKey = captcha.site_key || DEFAULT_CAPTCHA_SITEKEY;
		loadReCaptcha(siteKey, () => {});
	}

	UNSAFE_componentWillUpdate(_, nextState) {
		const { color, icons } = this.state;
		if (JSON.stringify(color) !== JSON.stringify(nextState.color)) {
			const themeOptions = Object.keys(nextState.color).map((value) => ({
				value,
			}));
			const calculatedThemes = calculateThemes(nextState.color);
			this.setState({
				themeOptions,
				color: calculatedThemes,
				icons: generateAllIcons(calculatedThemes, icons),
			});
		}
	}

	updateIcons = (icons = {}) => {
		this.setState((prevState) => ({
			...prevState,
			icons: merge({}, prevState.icons, icons),
		}));
	};

	removeIcon = (key) => {
		const iconObject = { [key]: getIconByKey(key) };
		this.updateIcons(iconObject);
	};

	updateColor = (color = {}) => {
		this.setState((prevState) => ({
			...prevState,
			color: {
				...prevState.color,
				...color,
			},
		}));
	};

	updateSections = (sections = {}) => {
		this.setState((prevState) => ({
			...prevState,
			sections: {
				...prevState.sections,
				...sections,
			},
		}));
	};

	removeTheme = (keys = []) => {
		const { color: prevColor } = this.state;
		const color = {};

		Object.entries(prevColor).forEach(([themeKey, theme]) => {
			if (!keys.includes(themeKey)) {
				color[themeKey] = theme;
			}
		});

		this.setState({
			color,
		});
	};

	updateDefaults = (defaultOverwriteObject = {}) => {
		this.setState((prevState) => ({
			...prevState,
			defaults: {
				...prevState.defaults,
				...defaultOverwriteObject,
			},
		}));
	};

	render() {
		const { children, activeTheme } = this.props;
		const { icons, color, themeOptions, defaults, sections } = this.state;
		const {
			updateIcons,
			removeIcon,
			updateColor,
			updateDefaults,
			removeTheme,
			updateSections,
		} = this;

		return (
			<ProjectConfig.Provider
				value={{
					defaults,
					icons: icons[activeTheme] || {},
					allIcons: icons,
					color,
					sections,
					themeOptions,
					updateIcons,
					updateColor,
					updateSections,
					updateDefaults,
					removeTheme,
					removeIcon,
				}}
			>
				{children}
			</ProjectConfig.Provider>
		);
	}
}

const mapStateToProps = ({ app: { theme: activeTheme, plugins } }) => ({
	activeTheme,
	plugins,
});

export default connect(mapStateToProps)(ConfigProvider);
