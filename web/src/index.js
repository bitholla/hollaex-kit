import 'core-js/stable';
import 'regenerator-runtime/runtime';
import React from 'react';
import { hash } from 'rsvp';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import merge from 'lodash.merge';
// import { render } from 'react-snapshot';
import { Router, browserHistory } from 'react-router';
import ConfigProvider from 'components/ConfigProvider';
import EditProvider from 'components/EditProvider';
import defaultConfig from 'config/project.config';
import './config/initialize';
import { addElements, injectHTML } from 'utils/script';

import 'flag-icon-css/css/flag-icon.min.css';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import 'react-alice-carousel/lib/alice-carousel.css';

import store from './store';
import { generateRoutes } from './routes';
import './index.css';
import '../node_modules/rc-tooltip/assets/bootstrap_white.css'; // eslint-disable-line

import {
	setLocalVersions,
	getLocalVersions,
	initializeStrings,
	setValidLanguages,
	setExchangeInitialized,
	setSetupCompleted,
	setBaseCurrency,
	setDefaultLogo,
} from 'utils/initialize';

import { getKitData } from 'actions/operatorActions';
import { setPairsData } from 'actions/orderbookAction';
import {
	requestConstant,
	setHomePageSetting,
	setInjectedValues,
	setInjectedHTML,
	requestPlugins,
	setWebViews,
	setPlugins,
	setInfo,
	setConfig,
	changeTheme,
	setLanguage,
	changePair,
	setPairs,
	setCurrencies,
	setOrderLimits,
	setHelpdeskInfo,
} from 'actions/appActions';
import { hasTheme } from 'utils/theme';
import { generateRCStrings } from 'utils/string';

import { version, name } from '../package.json';
import { API_URL, LANGUAGE_KEY } from './config/constants';
console.info(
	`%c${name.toUpperCase()} ${version}`,
	'color: #00509d; font-family:sans-serif; font-size: 20px; font-weight: 800'
);
console.info(
	`%c${API_URL}`,
	'font-family:sans-serif; font-size: 16px; font-weight: 600'
);

if (process.env.REACT_APP_PLUGIN_DEV_MODE === 'true') {
	console.info(
		'%cPLUGIN DEVELOPMENT MODE',
		'color: #00509d; font-family:sans-serif; font-size: 14px; font-weight: 600'
	);

	if (process.env.REACT_APP_PLUGIN_WEB_VIEW_TARGET) {
		console.info(
			`%cPlugin web_view target: ${process.env.REACT_APP_PLUGIN_WEB_VIEW_TARGET}`,
			'color: #00509d; font-family:sans-serif; font-size: 14px; font-weight: 600'
		);
	} else {
		console.info(
			'%cYou must pass target parameter',
			'color: #d90429; font-family:sans-serif'
		);
		console.info(
			'%cnpm run dev:plugin --target=TEST_WEB_VIEW_TARGET',
			'color: #55a630; background-color: #212529; font-family:sans-serif; line-height: 40px; padding: 10px'
		);
		throw new Error('target is not defined');
	}
}

const drawFavIcon = (url) => {
	const head = document.getElementsByTagName('head')[0];
	const linkEl = document.createElement('link');

	linkEl.type = 'image/x-icon';
	linkEl.rel = 'icon';
	linkEl.href = url;

	// remove existing favicons
	const links = head.getElementsByTagName('link');

	for (let i = links.length; --i >= 0; ) {
		if (/\bicon\b/i.test(links[i].getAttribute('rel'))) {
			head.removeChild(links[i]);
		}
	}

	head.appendChild(linkEl);
};

const getConfigs = async () => {
	const localVersions = getLocalVersions();

	const kitData = await getKitData();
	const {
		meta: { versions: remoteVersions = {}, sections = {} } = {},
		valid_languages = '',
		info: { initialized },
		setup_completed,
		native_currency,
		logo_image,
		features: { home_page = false } = {},
		injected_values = [],
		injected_html = {},
		captcha = {},
	} = kitData;

	store.dispatch(setConfig(kitData));
	if (kitData.defaults) {
		const themeColor = localStorage.getItem('theme');
		const isThemeValid = hasTheme(themeColor, kitData.color);
		const language = localStorage.getItem(LANGUAGE_KEY);

		if (kitData.defaults.theme && (!themeColor || !isThemeValid)) {
			store.dispatch(changeTheme(kitData.defaults.theme));
			localStorage.setItem('theme', kitData.defaults.theme);
		}

		if (!language && kitData.defaults.language) {
			store.dispatch(setLanguage(kitData.defaults.language));
		}
	}
	if (kitData.info) {
		store.dispatch(setInfo({ ...kitData.info }));
	}

	kitData['sections'] = sections;

	const promises = {};
	Object.keys(remoteVersions).forEach((key) => {
		const localVersion = localVersions[key];
		const remoteVersion = remoteVersions[key];

		if (localVersion !== remoteVersion) {
			promises[key] = kitData[key];
		} else {
			promises[key] = JSON.parse(localStorage.getItem(key) || '{}');
		}
	});

	const remoteConfigs = await hash(promises);
	Object.keys(remoteConfigs).forEach((key) => {
		if (key === 'color') {
			Object.entries(remoteConfigs[key]).forEach(([themeKey, themeObj]) => {
				if (typeof themeObj !== 'object') {
					delete remoteConfigs[key][themeKey];
				}
			});
		}
		localStorage.setItem(key, JSON.stringify(remoteConfigs[key]));
	});

	const { data: constants = {} } = await requestConstant();
	const { coins: coin_icons = {} } = constants;
	const {
		app: { pair },
	} = store.getState();

	if (!pair) {
		const initialPair = Object.keys(constants.pairs)[0];
		store.dispatch(changePair(initialPair));
	}

	store.dispatch(setPairs(constants.pairs));
	store.dispatch(setPairsData(constants.pairs));
	store.dispatch(setCurrencies(constants.coins));

	const orderLimits = {};
	Object.keys(constants.pairs).forEach((pair) => {
		orderLimits[pair] = {
			PRICE: {
				MIN: constants.pairs[pair].min_price,
				MAX: constants.pairs[pair].max_price,
				STEP: constants.pairs[pair].increment_price,
			},
			SIZE: {
				MIN: constants.pairs[pair].min_size,
				MAX: constants.pairs[pair].max_size,
				STEP: constants.pairs[pair].increment_price,
			},
		};
	});
	store.dispatch(setOrderLimits(orderLimits));

	setDefaultLogo(logo_image);
	setBaseCurrency(native_currency);
	setLocalVersions(remoteVersions);
	setValidLanguages(valid_languages);
	setExchangeInitialized(initialized);
	setSetupCompleted(setup_completed);
	store.dispatch(setHomePageSetting(home_page));
	store.dispatch(setInjectedValues(injected_values));
	store.dispatch(setInjectedHTML(injected_html));

	const { data = {} } = await requestPlugins();
	if (data.data && data.data.length !== 0) {
		store.dispatch(setPlugins(data.data));
		store.dispatch(setWebViews(data.data));
		store.dispatch(setHelpdeskInfo(data.data));
	}

	const appConfigs = merge({}, defaultConfig, remoteConfigs, {
		coin_icons,
		captcha,
	});

	return [appConfigs, injected_values, injected_html];
};

const bootstrapApp = (appConfig, injected_values, injected_html) => {
	const {
		icons: {
			dark: { EXCHANGE_FAV_ICON = '/favicon.ico' },
		},
	} = appConfig;
	addElements(injected_values, 'head');
	injectHTML(injected_html, 'head');
	drawFavIcon(EXCHANGE_FAV_ICON);
	// window.appConfig = { ...appConfig }
	const {
		app: { remoteRoutes, plugins },
	} = store.getState();

	const RCStrings = generateRCStrings(plugins);
	const mergedStrings = merge({}, RCStrings, appConfig.strings);

	initializeStrings(mergedStrings);

	render(
		<Provider store={store}>
			<EditProvider>
				<ConfigProvider initialConfig={appConfig}>
					<Router
						routes={generateRoutes(remoteRoutes)}
						history={browserHistory}
					/>
				</ConfigProvider>
			</EditProvider>
		</Provider>,
		document.getElementById('root')
	);
};

const initialize = async () => {
	try {
		const [configs, injected_values, injected_html] = await getConfigs();
		bootstrapApp(configs, injected_values, injected_html);
	} catch (err) {
		console.error('Initialization failed!\n', err);
		setTimeout(initialize, 3000);
	}
};

initialize().then(() => {});

// import registerServiceWorker from './registerServiceWorker'
// registerServiceWorker();
