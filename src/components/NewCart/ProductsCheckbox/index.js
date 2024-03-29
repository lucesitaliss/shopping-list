import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, Redirect, useLocation } from 'react-router-dom'
import { addProducts } from '../../../features/listProducts/listProductsSlice'
import { changeCheckedAccion } from '../../../features/listProducts/listProductsSlice'
import { addCart } from '../../../features/cart/cartSlice'
import { setLocalStorageToken } from '../../../features/localStoreToken/localStoreTokenSlice'
import './productCheckbox.css'
import 'animate.css'
import { getApiUrl } from '../../../api'
import { getToken } from '../../../utils/localStorage'
import CategorySelect from '../CategorySelect'

export default function ProductsCheckbox() {
	const dispatch = useDispatch()
	const { categoryId } = useSelector((state) => state.categorySelect)
	const { products } = useSelector((state) => state.listProducts)
	const { token } = useSelector((state) => state.localStorageToken)
	const { cart } = useSelector((state) => state.cart)
	
	const [isChecked, setIsChecked] = useState([])
	const [loadingListItems, setLoadingListItems] = useState({})
	const [loadingProducts, setLoadingProducts] = useState('')
	const [shouldRedirect, setShouldRedirect] = useState(false)

	useEffect(() => {
		dispatch(setLocalStorageToken(getToken()))
	}, [])

	useEffect(() => {
		categoryId && getProductsByCategory()
	}, [categoryId])

	useEffect(() => {
		products && changeChecked()
	}, [products])

	const getProductsByCategory = async () => {
		try {
			if (categoryId > 0) {
				const apiUrl = getApiUrl(`products/category/${categoryId}`)
				setLoadingProducts(true)
				const response = await fetch(apiUrl, {
					headers: { 'x-acces-token': token },
				})
				const result = await response.json()
				dispatch(addProducts(result))
			}
		} catch (error) {
			console.error({error})
		} finally {
			setLoadingProducts(false)
		}
	}

	const handleChange = async (e) => {
		try {
			const dataBody = {
				checkedValue: e.target.checked,
				productId: e.target.id,
			}

			setLoadingListItems((prev) => ({
				...prev,
				[e.target.id]: true,
			}))

			const apiUrlChecked = getApiUrl('product/checked')
			const updateChecked = await fetch(apiUrlChecked, {
				method: 'PUT',
				body: JSON.stringify(dataBody),
				headers: {
					'content-type': 'application/json',
					'x-acces-token': token,
				},
			})

			if (updateChecked.ok) {
				const updateProduct = await updateChecked.json()
				dispatch(changeCheckedAccion(updateProduct[0]))
			}
		} catch (error) {
			console.error({ error })
		} finally {
			setLoadingListItems((prev) => ({
				...prev,
				[e.target.id]: false,
			}))
		}
	}

	const insertCart = async () => {
		try {
			const apiUrlProducts = getApiUrl('products')
			const getProducts = await fetch(apiUrlProducts, {
				headers: {
					'x-acces-token': token,
				},
			})
			if (getProducts.ok) {
				const allProducts = await getProducts.json()
				const selectedProducts = allProducts.filter(
					(products) => products.checked === true,
				)
				const apiUrlCart = getApiUrl('cart')
				const response = await fetch(apiUrlCart, {
					method: 'POST',
					body: JSON.stringify(selectedProducts),
					headers: {
						'content-type': 'application/json',
						'x-acces-token': token,
					},
				})
				const postCart = await response.json()
				if (response.ok) {
					dispatch(addCart(postCart))
					setShouldRedirect(true)
				}
			}
		} catch (error) {
			console.error({ error })
		}
	}

	const handleSumit = async (e) => {
		e.preventDefault()
		insertCart()
	}

	const clean = async (e) => {
		try {
			const apiUrl = getApiUrl('products/checked/reset')
			const resetChecked = await fetch(apiUrl, {
				method: 'PUT',
				headers: { 'x-acces-token': token },
			})

			if (resetChecked.ok) {
				await resetChecked.json()
				getProductsByCategory()
			}
		} catch (error) {
			console.error({error})
		}
	}

	const changeChecked = () => {
		if (categoryId) {
			const checked = products.filter((product) => product.checked === true)
			setIsChecked(checked)
		}
	}

	if (shouldRedirect) {
		return <Redirect to="/" />
	}

	return (
		<div className="container">
			<form className="form-product-checkbox" onSubmit={handleSumit}>
				<div className="buttons-containers">
					<CategorySelect />
					<button className="primary" disabled={!isChecked.length} name="send">
						{cart ? 'Update and navigate' : 'Create cart'}
					</button>
					<button disabled={!isChecked.length} onClick={clean}>
						Clean
					</button>
				</div>

				{loadingProducts ? (
					<div className="containerSpinner">
						<div className="spinner"></div>
					</div>
				) : (
					<div className="checkbox-container">
						{products.map((product) => {
							return (
								<label className="product-select" key={product.product_id}>
									<input
										id={product.product_id}
										type="checkbox"
										onChange={handleChange}
										checked={product.checked}
										className={
											loadingListItems[product.product_id] ? 'checkbox-spin' : ''
										}
									/>
									{product.product_name}
								</label>
							)
						})}
					</div>
				)}
			</form>
		</div>
	)
}
