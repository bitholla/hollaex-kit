const getPluginNameByType = (type) => {
	switch (type) {
		case 'phone':
			return 'sms';
		default:
			return type;
	}
};

export const mapPluginsTypeToName = (enabledPluginsTypes = []) =>
	enabledPluginsTypes
		.filter((type) => !!type)
		.map((type) => getPluginNameByType(type));
