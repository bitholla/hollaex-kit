import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { RemoteComponent } from 'RemoteComponent';
import STRINGS from 'config/localizedStrings';
import withConfig from 'components/ConfigProvider/withConfig';
import { getToken } from 'utils/token';
import { PLUGIN_URL } from 'config/constants';
import { withRouter } from 'react-router';
import { generateGlobalId } from 'utils/id';

const SmartTarget = (props) => {
	const { targets, id, children, webViews } = props;

	return targets.includes(id) ? (
		<Fragment>
			{webViews[id].map(({ src, name }, index) => (
				<RemoteComponent
					key={`${name}_${index}`}
					url={src}
					generateId={generateGlobalId(name)}
					strings={STRINGS}
					plugin_url={PLUGIN_URL}
					token={getToken()}
					{...props}
				/>
			))}
		</Fragment>
	) : (
		<Fragment>{children}</Fragment>
	);
};

const mapStateToProps = (store) => ({
	targets: store.app.targets,
	webViews: store.app.webViews,
	isReady: store.app.isReady,
	coins: store.app.coins,
	symbol: store.orderbook.symbol,
	prices: store.orderbook.prices,
	balance: store.user.balance,
	totalAsset: store.asset.totalAsset,
	oraclePrices: store.asset.oraclePrices,
	chartData: store.asset.chartData,
	activeNotification: store.app.activeNotification,
	activeLanguage: store.app.language,
	activeTheme: store.app.theme,
	user: store.user,
	pair: store.app.pair,
	unreadMessages: store.app.chatUnreadMessages,
	constants: store.app.constants,
	info: store.app.info,
	enabledPlugins: store.app.enabledPlugins,
	plugins: store.app.plugins,
	features: store.app.features,
	config_level: store.app.config_level,
	pairsTradesFetched: store.orderbook.pairsTradesFetched,
});

export default connect(mapStateToProps)(withConfig(withRouter(SmartTarget)));
