export const generateGlobalId = (pluginName) => (key) =>
	`RC_${pluginName.toUpperCase()}_${key.toUpperCase()}`;
