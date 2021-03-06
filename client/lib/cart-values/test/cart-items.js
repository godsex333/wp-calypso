/** @format */

import {
	PLAN_FREE,
	PLAN_BLOGGER,
	PLAN_BLOGGER_2_YEARS,
	PLAN_PERSONAL,
	PLAN_PERSONAL_2_YEARS,
	PLAN_PREMIUM,
	PLAN_PREMIUM_2_YEARS,
	PLAN_BUSINESS,
	PLAN_BUSINESS_2_YEARS,
	PLAN_JETPACK_FREE,
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_PERSONAL_MONTHLY,
} from 'lib/plans/constants';

// Gets rid of warnings such as 'UnhandledPromiseRejectionWarning: Error: No available storage method found.'
jest.mock( 'lib/user', () => () => {} );

const cartItems = require( '../cart-items' );
const { getTermDuration, getPlan } = require( 'lib/plans' );
const {
	planItem,
	replaceItem,
	getItemForPlan,
	isNextDomainFree,
	hasRenewableSubscription,
	isDomainBeingUsedForPlan,
	getCartItemBillPeriod,
	getDomainPriceRule,
} = cartItems;

/**
 * External dependencies
 */

describe( 'planItem()', () => {
	test( 'should return null for free plan', () => {
		expect( planItem( PLAN_FREE ) ).toBe( null );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( product_slug => {
		test( `should return an object for non-free plan (${ product_slug })`, () => {
			expect( planItem( product_slug ).product_slug ).toBe( product_slug );
		} );
	} );
} );

describe( 'getItemForPlan()', () => {
	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_JETPACK_PERSONAL,
		PLAN_JETPACK_PERSONAL_MONTHLY,
	].forEach( product_slug => {
		test( `should return personal plan item for personal plan ${ product_slug }`, () => {
			expect( getItemForPlan( { product_slug } ).product_slug ).toBe( product_slug );
		} );
	} );
	[
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_JETPACK_PREMIUM,
		PLAN_JETPACK_PREMIUM_MONTHLY,
	].forEach( product_slug => {
		test( `should return personal plan item for a premium plan ${ product_slug }`, () => {
			expect( getItemForPlan( { product_slug } ).product_slug ).toBe( product_slug );
		} );
	} );

	[
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
		PLAN_JETPACK_BUSINESS,
		PLAN_JETPACK_BUSINESS_MONTHLY,
	].forEach( product_slug => {
		test( `should return personal plan item for a business plan ${ product_slug }`, () => {
			expect( getItemForPlan( { product_slug } ).product_slug ).toBe( product_slug );
		} );
	} );

	[ PLAN_FREE, PLAN_JETPACK_FREE ].forEach( product_slug => {
		test( `should throw an error for plan ${ product_slug }`, () => {
			expect( () => getItemForPlan( { product_slug } ).product_slug ).toThrow();
		} );
	} );
} );

describe( 'getCartItemBillPeriod()', () => {
	test( 'if cartItem has bill_period property, it should be returned', () => {
		expect( getCartItemBillPeriod( { bill_period: 180 } ) ).toBe( 180 );
		expect( getCartItemBillPeriod( { bill_period: 114 } ) ).toBe( 114 );
		expect( getCartItemBillPeriod( { bill_period: 4 } ) ).toBe( 4 );
		expect( getCartItemBillPeriod( { bill_period: -1 } ) ).toBe( -1 );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_JETPACK_PERSONAL,
		PLAN_JETPACK_PERSONAL_MONTHLY,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_JETPACK_PREMIUM,
		PLAN_JETPACK_PREMIUM_MONTHLY,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
		PLAN_JETPACK_BUSINESS,
		PLAN_JETPACK_BUSINESS_MONTHLY,
	].forEach( product_slug => {
		test( `should return plan bill_period for any plan with product_slug ${ product_slug }`, () => {
			const expected_bill_period = getTermDuration( getPlan( product_slug ).term );

			expect(
				getCartItemBillPeriod( {
					product_slug,
				} )
			).toBe( expected_bill_period );
		} );
	} );
} );

describe( 'hasRenewableSubscription()', () => {
	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_JETPACK_PERSONAL,
		PLAN_JETPACK_PERSONAL_MONTHLY,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_JETPACK_PREMIUM,
		PLAN_JETPACK_PREMIUM_MONTHLY,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
		PLAN_JETPACK_BUSINESS,
		PLAN_JETPACK_BUSINESS_MONTHLY,
	].forEach( product_slug => {
		test( `should return true for product with bill_period same as plan ${ product_slug }`, () => {
			const bill_period = getTermDuration( getPlan( product_slug ).term );

			expect(
				hasRenewableSubscription( {
					products: [ { bill_period } ],
				} )
			).toBe( true );
		} );

		test( `should return true for product with product_slug same as plan ${ product_slug }`, () => {
			expect(
				hasRenewableSubscription( {
					products: [ { product_slug } ],
				} )
			).toBe( true );
		} );
	} );
} );

describe( 'replaceItem()', () => {
	test( 'should return a function', () => {
		expect( typeof replaceItem() ).toBe( 'function' );
	} );

	test( 'should replace a cart item', () => {
		const oldProduct = { id: 1, product_slug: '1' };
		const newProduct = { id: 2, product_slug: '2' };
		const cart = {
			products: [ oldProduct ],
		};
		const newCart = replaceItem( oldProduct, newProduct )( cart );
		expect( typeof newCart ).toBe( 'object' );
		expect( newCart.products.length ).toBe( 1 );
		expect( newCart.products[ 0 ] ).toBe( newProduct );
	} );

	test( 'should preserve other cart items when replacing a cart item', () => {
		const oldProduct = { id: 1, product_slug: '1' };
		const newProduct = { id: 2, product_slug: '2' };
		const neutralProduct = { id: 3, product_slug: '3' };
		const cart = {
			products: [ oldProduct, neutralProduct ],
		};
		const newCart = replaceItem( oldProduct, newProduct )( cart );
		expect( typeof newCart ).toBe( 'object' );
		expect( newCart.products.length ).toBe( 2 );
		expect( newCart.products[ 0 ] ).toBe( neutralProduct );
		expect( newCart.products[ 1 ] ).toBe( newProduct );
	} );

	test( 'should just add new item when old one is missing', () => {
		const oldProduct = { id: 1, product_slug: '1' };
		const newProduct = { id: 2, product_slug: '2' };
		const neutralProduct = { id: 3, product_slug: '3' };
		const cart = {
			products: [ neutralProduct ],
		};
		const newCart = replaceItem( oldProduct, newProduct )( cart );
		expect( typeof newCart ).toBe( 'object' );
		expect( newCart.products.length ).toBe( 2 );
		expect( newCart.products[ 0 ] ).toBe( neutralProduct );
		expect( newCart.products[ 1 ] ).toBe( newProduct );
	} );
} );

describe( 'isDomainBeingUsedForPlan()', () => {
	const buildCartWithDomain = ( plan_slug = PLAN_PREMIUM, domain = 'domain.com' ) => ( {
		products: [
			{ product_slug: plan_slug },
			{
				is_domain_registration: true,
				meta: domain,
			},
		],
	} );
	test( 'should return true for premium plan and .com domain', () => {
		expect( isDomainBeingUsedForPlan( buildCartWithDomain(), 'domain.com' ) ).toBe( true );
	} );
	test( 'should return false when cart is null', () => {
		expect( isDomainBeingUsedForPlan( null, 'domain.com' ) ).toBe( false );
	} );
	test( 'should return false when domain is falsey', () => {
		expect( isDomainBeingUsedForPlan( buildCartWithDomain(), null ) ).toBe( false );
	} );
	test( 'should return false when domain does not match one in the cart', () => {
		expect( isDomainBeingUsedForPlan( buildCartWithDomain(), 'anotherdomain.com' ) ).toBe( false );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( product_slug => {
		test( `should return true for ${ product_slug } plan and .com domain`, () => {
			expect( isDomainBeingUsedForPlan( buildCartWithDomain( product_slug ), 'domain.com' ) ).toBe(
				true
			);
		} );
	} );

	[
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
	].forEach( product_slug => {
		test( `should return true for ${ product_slug } plan and .blog domain`, () => {
			expect(
				isDomainBeingUsedForPlan(
					buildCartWithDomain( product_slug, 'domain.blog' ),
					'domain.blog'
				)
			).toBe( true );
		} );
	} );

	[ PLAN_BLOGGER, PLAN_BLOGGER_2_YEARS ].forEach( product_slug => {
		test( `should return false for ${ product_slug } plan and .com domain`, () => {
			expect( isDomainBeingUsedForPlan( buildCartWithDomain( product_slug ), 'domain.com' ) ).toBe(
				false
			);
		} );
	} );

	[ PLAN_BLOGGER, PLAN_BLOGGER_2_YEARS ].forEach( product_slug => {
		test( `should return false for ${ product_slug } plan and .blog domain`, () => {
			expect(
				isDomainBeingUsedForPlan(
					buildCartWithDomain( product_slug, 'domain.blog' ),
					'domain.blog'
				)
			).toBe( true );
		} );
	} );
} );

describe( 'isNextDomainFree()', () => {
	test( 'should return true when cart.next_domain_is_free is true', () => {
		expect( isNextDomainFree( { next_domain_is_free: true } ) ).toBe( true );
	} );
	test( 'should return true when cart.next_domain_is_free, next_domain_condition is empty and no domain is passed', () => {
		expect( isNextDomainFree( { next_domain_is_free: true, next_domain_condition: '' } ) ).toBe(
			true
		);
	} );
	test( 'should return false when cart.next_domain_is_free, next_domain_condition is blog and no domain is passed', () => {
		expect( isNextDomainFree( { next_domain_is_free: true, next_domain_condition: 'blog' } ) ).toBe(
			false
		);
	} );
	test( 'should return false when cart.next_domain_is_free is true, but condition is "blog" and requested domain is .com', () => {
		expect(
			isNextDomainFree( { next_domain_is_free: true, next_domain_condition: 'blog' }, 'domain.com' )
		).toBe( false );
	} );
	test( 'should return true when cart.next_domain_is_free is true, but condition is "blog" and requested domain is .blog', () => {
		expect(
			isNextDomainFree(
				{ next_domain_is_free: true, next_domain_condition: 'blog' },
				'domain.blog'
			)
		).toBe( true );
	} );
	test( 'should return false when cart.next_domain_is_free is false', () => {
		expect( isNextDomainFree( { next_domain_is_free: false } ) ).toBe( false );
	} );
	test( 'should return false when cart is null', () => {
		expect( isNextDomainFree( null ) ).toBe( false );
	} );
} );

describe( 'getDomainPriceRule()', () => {
	test( 'should return FREE_DOMAIN when product slug is empty', () => {
		expect( getDomainPriceRule( false, null, null, { product_slug: null, cost: '14' } ) ).toBe(
			'FREE_DOMAIN'
		);
	} );
	test( 'should return FREE_DOMAIN when cost is Free', () => {
		expect( getDomainPriceRule( false, null, null, { product_slug: 'hi', cost: 'Free' } ) ).toBe(
			'FREE_DOMAIN'
		);
	} );
} );
