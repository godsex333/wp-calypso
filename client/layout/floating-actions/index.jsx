/** @format */
/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import InlineHelp from 'blocks/inline-help';
import config from 'config';
import hasActiveHappychatSession from 'state/happychat/selectors/has-active-happychat-session';
import HappychatButton from 'components/happychat/button';
import { isCommunityTranslatorEnabled } from 'components/community-translator/utils';
import AsyncLoad from 'components/async-load';
import TranslatorLauncher from 'layout/community-translator/launcher';
import EnvironmentBadge from 'blocks/environment-badge';


const FloatingActions = ( { isHappychatButtonVisible, showInlineHelp = true } ) => (
	<div className="floating-actions">
		<div className="floating-actions__vertical-bar">
			{ showInlineHelp && <InlineHelp /> }
			{ config.isEnabled( 'i18n/community-translator' ) ? (
				isCommunityTranslatorEnabled() ||
				( false && <AsyncLoad require="components/community-translator" /> )
			) : (
				<TranslatorLauncher />
			) }
			{ isHappychatButtonVisible &&
				config.isEnabled( 'happychat' ) && <HappychatButton allowMobileRedirect /> }
		</div>
		<EnvironmentBadge />
	</div>
);

FloatingActions.displayName = 'FloatingActions';

FloatingActions.propTypes = {
	isHappychatButtonVisible: PropTypes.bool,
	showInlineHelp: PropTypes.bool,
};

export default connect( state => ( {
	isHappychatButtonVisible: hasActiveHappychatSession( state ),
} ) )( FloatingActions );
