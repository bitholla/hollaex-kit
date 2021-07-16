import defaultIcons from 'config/icons';
import merge from 'lodash.merge';
import { generateGlobalId } from 'utils/id';

const defaultIconsKey = 'dark';

export const getIconByKey = (
	key,
	theme = defaultIconsKey,
	content = defaultIcons
) => {
	return content[theme][key];
};

const BACKGROUND_ICON_IDS = ['EXCHANGE_LOGO', 'EXCHANGE_LOADER'];

export const isBackgroundIcon = (iconId) =>
	BACKGROUND_ICON_IDS.includes(iconId);

const generateServerSideDefaultIcons = (coins) => {
	const icons = {};
	Object.entries(coins).forEach(([key, { logo }]) => {
		if (logo) {
			icons[`${key.toUpperCase()}_ICON`] = logo;
		}
	});

	return icons;
};

const generateRCIcons = (themes, plugins = []) => {
	const themeKeys = Object.keys(themes);
	const allIcons = {};

	themeKeys.forEach((key) => {
		allIcons[key] = {};
	});

	plugins.forEach(({ name, web_view = [] }) => {
		if (web_view) {
			web_view.forEach(({ meta: { icons = {} } = { icons: {} } }) => {
				Object.entries(icons).forEach(([themeKey, themeSpecificIcons]) => {
					if (themeKeys.includes(themeKey)) {
						Object.entries(themeSpecificIcons).forEach(([key, icon]) => {
							allIcons[themeKey][generateGlobalId(name)(key)] = icon;
						});
					}
				});
			});
		}
	});

	return allIcons;
};

export const generateAllIcons = (
	themes,
	icons,
	coin_icons = {},
	plugins = []
) => {
	const coinKeys = Object.keys(coin_icons);
	const themeKeys = Object.keys(themes);

	// server-side coin icons
	const serverSideDefaultCoinIcons = generateServerSideDefaultIcons(coin_icons);

	// remote components icons
	const RCIcons = generateRCIcons(themes, plugins);

	// missing keys and values are set from the default Icons Object
	const defaultIconsObject = merge(
		{},
		RCIcons[defaultIconsKey],
		icons[defaultIconsKey],
		serverSideDefaultCoinIcons
	);

	const allIcons = {};

	themeKeys.forEach((theme) => {
		const themeSpecificIconsObject = icons[theme] || {};
		const themeSpecificRCIcons = RCIcons[theme] || {};
		allIcons[theme] = merge(
			{},
			defaultIconsObject,
			themeSpecificRCIcons,
			themeSpecificIconsObject
		);

		// default coin icon set for coins without icon
		const defaultCoinIcon = allIcons[theme]['DEFAULT_ICON'];

		// default dynamic coin icons
		coinKeys.forEach((coinKey = '') => {
			const coin = `${coinKey.toUpperCase()}_ICON`;
			if (!allIcons[theme][coin]) {
				allIcons[theme][coin] = defaultCoinIcon;
			}
		});
	});

	return allIcons;
};

export const addDefaultLogo = (defaultLogo, icons) => {
	if (!icons[defaultIconsKey]['EXCHANGE_LOGO']) {
		icons[defaultIconsKey]['EXCHANGE_LOGO'] = defaultLogo;
	}
	return icons;
};

export const getAllIconsArray = (themeKeys, content = defaultIcons) => {
	const allIcons = [];

	Object.keys(content[defaultIconsKey]).forEach((key) => {
		const iconObject = { key };
		themeKeys.forEach((theme) => {
			iconObject[theme] = getIconByKey(key, theme, content);
		});
		allIcons.push(iconObject);
	});

	return allIcons;
};

export const generateRemoteRouteIconId = (id = '') => {
	return `REMOTE_ROUTE_ICON__${id.toUpperCase()}`;
};

const sizeLimitInMB = 2;

export const checkFileSize = (file) => {
	if (file && file.size) {
		const sizeLimit = sizeLimitInMB * 1024 * 1024;
		return file.size < sizeLimit;
	}
};

export const fileSizeError = `The Uploaded file exceeds the maximum file size of ${sizeLimitInMB}MB`;
