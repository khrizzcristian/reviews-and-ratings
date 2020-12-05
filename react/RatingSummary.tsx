import React, {
  FunctionComponent,
  Fragment,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import { Helmet } from 'react-helmet'
import ApolloClient, { ApolloQueryResult } from 'apollo-client'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { withApollo } from 'react-apollo'
import { ProductContext } from 'vtex.product-context'
import { useCssHandles } from 'vtex.css-handles'
import { FormattedMessage } from 'react-intl'
import { Link, canUseDOM } from 'vtex.render-runtime'
import { path } from 'ramda'
import { Button } from 'vtex.styleguide'

import AppSettings from '../graphql/appSettings.graphql'
import Stars from './components/Stars'
import TotalReviewsByProductId from '../graphql/totalReviewsByProductId.graphql'
import AverageRatingByProductId from '../graphql/averageRatingByProductId.graphql'

interface Product {
  productId: string
  productName: string
}

interface Props {
  client: ApolloClient<NormalizedCacheObject>
}

interface TotalData {
  totalReviewsByProductId: number
}

interface AverageData {
  averageRatingByProductId: number
}

interface SettingsData {
  appSettings: AppSettings
}

interface AppSettings {
  allowAnonymousReviews: boolean
  requireApproval: boolean
  useLocation: boolean
  defaultOpen: boolean
  defaultOpenCount: number
  showGraph: boolean
  displaySummaryIfNone: boolean
  displaySummaryTotalReviews: boolean
  displaySummaryAddButton: boolean
}

interface State {
  total: number
  average: number
  hasTotal: boolean
  hasAverage: boolean
  settings: AppSettings
  userAuthenticated: boolean
}

declare let global: {
  __hostname__: string
  __pathname__: string
}

type ReducerActions =
  | { type: 'SET_TOTAL'; args: { total: number } }
  | { type: 'SET_AVERAGE'; args: { average: number } }
  | { type: 'SET_SETTINGS'; args: { settings: AppSettings } }
  | { type: 'SET_AUTHENTICATED'; args: { authenticated: boolean } }

const initialState = {
  total: 0,
  average: 0,
  hasTotal: false,
  hasAverage: false,
  settings: {
    defaultOpen: false,
    defaultOpenCount: 0,
    allowAnonymousReviews: false,
    requireApproval: true,
    useLocation: false,
    showGraph: false,
    displaySummaryIfNone: false,
    displaySummaryTotalReviews: true,
    displaySummaryAddButton: false,
  },
  userAuthenticated: false,
}

const reducer = (state: State, action: ReducerActions) => {
  switch (action.type) {
    case 'SET_TOTAL':
      return {
        ...state,
        total: action.args.total,
        hasTotal: true,
      }
    case 'SET_AVERAGE':
      return {
        ...state,
        average: action.args.average,
        hasAverage: true,
      }
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.args.settings,
      }
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        userAuthenticated: action.args.authenticated,
      }
    default:
      return state
  }
}

const CSS_HANDLES = [
  'summaryContainer',
  'loginLink',
  'summaryButtonContainer',
] as const

const RatingSummary: FunctionComponent<Props> = props => {
  const { client } = props

  const handles = useCssHandles(CSS_HANDLES)
  const { product } = useContext(ProductContext) as any
  const { productId, productName }: Product = product || {}

  const [state, dispatch] = useReducer(reducer, initialState)

  const getLocation = () =>
    canUseDOM
      ? {
          url: window.location.pathname + window.location.hash,
          pathName: window.location.pathname,
        }
      : { url: global.__pathname__, pathName: global.__pathname__ }

  const { url } = getLocation()

  useEffect(() => {
    if (!productId) {
      return
    }

    client
      .query({
        query: TotalReviewsByProductId,
        variables: {
          productId,
        },
      })
      .then((response: ApolloQueryResult<TotalData>) => {
        const total = response.data.totalReviewsByProductId
        dispatch({
          type: 'SET_TOTAL',
          args: { total },
        })
      })

    client
      .query({
        query: AverageRatingByProductId,
        variables: {
          productId,
        },
      })
      .then((response: ApolloQueryResult<AverageData>) => {
        const average = response.data.averageRatingByProductId
        dispatch({
          type: 'SET_AVERAGE',
          args: { average },
        })
      })

    client
      .query({
        query: AppSettings,
      })
      .then((response: ApolloQueryResult<SettingsData>) => {
        const settings = response.data.appSettings
        dispatch({
          type: 'SET_SETTINGS',
          args: { settings },
        })
      })
  }, [client, productId])

  useEffect(() => {
    window.__RENDER_8_SESSION__.sessionPromise.then((data: any) => {
      const sessionRespose = data.response

      if (!sessionRespose || !sessionRespose.namespaces) {
        return
      }

      const { namespaces } = sessionRespose
      const storeUserId = namespaces?.authentication?.storeUserId?.value
      if (!storeUserId) {
        return
      }
      dispatch({
        type: 'SET_AUTHENTICATED',
        args: { authenticated: true },
      })
    })
  }, [])

  const scrollToForm = () => {
    const reviewsContainer = document.getElementById('reviews-main-container')
    if (reviewsContainer) reviewsContainer.scrollIntoView()
  }

  return (
    <div className={`${handles.summaryContainer} review-summary mw8 center`}>
      {!state.hasTotal || !state.hasAverage ? (
        <Fragment>Loading reviews...</Fragment>
      ) : state.total === 0 && !state.settings.displaySummaryIfNone ? null : (
        <Fragment>
          <Helmet>
            <script type="application/ld+json">
              {JSON.stringify({
                '@context': 'http://schema.org',
                '@type': 'Product',
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: state.average.toString(),
                  reviewCount: state.total.toString(),
                },
                name: productName,
              })}
            </script>
          </Helmet>
          <span className="t-heading-4 v-mid">
            <Stars rating={state.average} />
          </span>{' '}
          {state.settings.displaySummaryTotalReviews ? (
            <span className="review__rating--count dib v-mid">
              ({state.total})
            </span>
          ) : null}
          {state.settings.displaySummaryAddButton ? (
            (state.settings && state.settings.allowAnonymousReviews) ||
            (state.settings &&
              !state.settings.allowAnonymousReviews &&
              state.userAuthenticated) ? (
              <div className={`${handles.summaryButtonContainer}`}>
                <Button
                  onClick={() => {
                    scrollToForm()
                  }}
                >
                  <FormattedMessage id="store/reviews.list.writeReview" />
                </Button>
              </div>
            ) : (
              <div className={`${handles.summaryButtonContainer}`}>
                <Link
                  page="store.login"
                  query={`returnUrl=${encodeURIComponent(url)}`}
                  className={`${handles.loginLink} h1 w2 tc flex items-center w-100-s h-100-s pa4-s`}
                >
                  <FormattedMessage id="store/reviews.list.login" />
                </Link>
              </div>
            )
          ) : null}
        </Fragment>
      )}
    </div>
  )
}

export default withApollo(RatingSummary)
