let db = require('../confiq/connection')
let collection = require('../confiq/collection');
let bcrypt = require('bcrypt');
let objectId = require('mongodb').ObjectId
let promise = require('promise');
const async = require('hbs/lib/async');
const moment = require('moment')
const { resolve, reject } = require('promise');
const { response } = require('express');
const Razorpay = require('razorpay')
let instance = new Razorpay({
    key_id: 'rzp_test_dr0FHEhpWl7aRM',
    key_secret: 'MLgjh2yaPXkedjkUXQzImWR9',
});
module.exports = {
    doSignup: (userData) => {

        return new promise(async (resolve, request) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                resolve(data)
            })
            if (userData.referedBy != "") {

                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userData.referedBy) }, { $inc: { wallet: 100 } })


            }

        })

    },
    doLogin: (userData) => {

        return new promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (!user.userBlock) {
                if (user) {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if (status) {

                            response.user = user;
                            response.status = true
                            resolve(response);
                        } else {

                            resolve({ status: false })
                        }
                    })

                } else {
                    resolve({ status: false })

                }
            } else {
                resolve(user)
            }
        })
    },
    imageDetails: (id) => {

        return new promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })

        })

    },
    checkPhone: (phone) => {
        console.log(phone);
        return new promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({ phoneNumber: phone }).then((resp) => {

                resolve(resp)

            })
        })
    },
    doLoginOtp: (phone) => {
        return new promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ phoneNumber: phone })

            resolve(user)
        })

    },
    emailCheck: (email, phone) => {
        return new promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ $or: [{ email: email }, { phoneNumber: phone }] })

            resolve(user)

        })
    },
    categoryView: (categoryview) => {
        return new promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: categoryview }).toArray()
            resolve(product)
        })
    },
    addToCart: (proId, userId) => {
        console.log(proId);
        console.log(userId);
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (userCart) {

                let proExist = userCart.products.findIndex(product => product.item == proId)

                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).
                        updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }

                        }

                    ).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    // wishlist
    addToWishlist: (proId, userId) => {

        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })

            if (userWishlist) {

                let proExist = userWishlist.products.findIndex(product => product.item == proId)

                if (proExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).
                        updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }

                        }

                    ).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getwishilistProducts: (userId) => {

        return new promise(async (resolve, reject) => {
            let items = await db
                .get()
                .collection(collection.WISHLIST_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) },
                    },
                    {
                        $unwind: "$products",
                    },
                    {
                        $project: {
                            item: "$products.item",
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                ])
                .toArray();
            resolve(items);
        });
    },

    getWishlistCount: (userId) => {
        let count = 0
        return new promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },


    deleteWishlist: (wishlistId) => {
        let userId = wishlistId.user
        let product = wishlistId.prodId
        return new promise((resolve, reject) => {
            db.get()
                .collection(collection.WISHLIST_COLLECTION)
                .updateOne(
                    { user: objectId(userId) },
                    {
                        $pull: { products: { item: objectId(product) } },
                    }
                )
                .then(() => {
                    resolve();
                })
        })
    },

    getCartProducts: (userId) => {
        return new promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)
        })

    },
    getCarCount: (userId) => {
        let count = 0
        return new promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).
                    updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })

            } else {
                db.get().collection(collection.CART_COLLECTION).
                    updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then(() => {
                        resolve({ status: true })
                    })
            }

        })
    },
    removeCartProduct: (details) => {
        return new promise((resolve, reject) => {

            console.log("aaaa", details);
            db.get().collection(collection.CART_COLLECTION).
                updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(response)
                })
        })


    },
    getTotalAmount: (userId) => {
        return new promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.offerPrice' }] } }
                    }
                }

            ]).toArray()


            resolve(total[0]?.total)

        })

    },

    // add address
    placeOrder: (order, products, total) => {
        return new promise((resolve, reject) => {
            console.log("iiii", order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let dateIso = new Date()
            let date = moment(dateIso).format('YYYY/MM/DD')
            let time = moment(dateIso).format('HH:mm:ss')
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    mobile: order.phoneNumber,
                    address: order.address,
                    pincode: order.pincode,
                    state: order.state,
                    city: order.city,
                    userId: objectId(order.userId)

                },
                userId: objectId(order.userId),
                paymentMethode: order['payment-method'],
                products: products,
                totalAmount: total,
                DateIso: dateIso,

                status: status,
                date: date,
                Time: time

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.ADDRESS_COLLECTION).insertOne(orderObj.deliveryDetails).then((respons) => {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                    resolve(response.insertedId)

                })

            })


        })

    },
    // address select
    placeOrderr: (order, products, total, method) => {
        return new promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let dateIso = new Date()
            let date = moment(dateIso).format('YYYY/MM/DD')
            let time = moment(dateIso).format('HH:mm:ss')
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    mobile: order.phoneNumber,
                    address: order.address,
                    pincode: order.pincode,
                    state: order.state,
                    city: order.city,
                    userId: objectId(order.userId)

                },
                userId: objectId(order.userId),
                paymentMethode: method,
                products: products,
                totalAmount: total,
                DateIso: dateIso,
                status: status,
                date: date,
                Time: time

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response.insrtedId)
            })

        })




    },


    getCartProductList: (userId) => {
        return new promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart?.products)
        })
    },
    getUserOrders: (userId) => {
        return new promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ _id: -1 }).toArray()

            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {

        return new promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()


            resolve(cartItems)
        })
    },
    getAddressDetails: (userId) => {

        return new promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: objectId(userId) }).toArray()

            resolve(address)
        })
    },
    getProfile: (userId) => {
        return new promise(async (resolve, reject) => {
            let profile = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

            resolve(profile)
        })
    },
    updateProfileDetails: (userId, userDetails) => {
        return new promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    name: userDetails.name,
                    email: userDetails.email
                }

            }).then((response) => {
                resolve()
            })
        })

    },
    getUserAddressDetails: (addressId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) }).then((address) => {

                resolve(address)
            })
        })
    },
    cancelOrder: (orderId) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: "Cancelled"
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    removeUserAddress: (address) => {
        return new promise((resolve, reject) => {

            db.get().collection(collection.ADDRESS_COLLECTION).
                remove({ _id: objectId(address) },

            ).then((response) => {

                resolve(response)
            })
        })


    },
    editUserAddress: (addressId, address) => {
        return new promise(async (res, rej) => {
            await db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: objectId(addressId) }, {
                $set: {

                    name: address.name,
                    address: address.address,
                    state: address.state,
                    pincode: address.pincode,
                    city: address.city,

                }
            }
            ).then((resp) => {

                res(resp)
            })

        })
    },
    // edit user profile
    changePassword: (details) => {
        return new promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(details.userId) })
            if (user) {
                bcrypt.compare(details.cPassword, user.password).then(async (status) => {
                    if (status) {
                        details.nPassword = await bcrypt.hash(details.nPassword, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(details.userId) }, {
                            $set: {
                                password: details.nPassword
                            }
                        }).then((response) => {
                            if (response) {
                                resolve({ status: true, succPass: "Password changed" })
                            } else {
                                resolve({ status: false, errorPass: "Password not updated" })
                            }
                        })

                    } else {
                        resolve({ status: false, errorPass: "Please enter the current Password properly" })
                    }

                })
            }
        })

    }, editProfileDetails: (addressId, user) => {
        return new promise(async (res, rej) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(addressId) }, {
                $set: {

                    name: user.name,
                    address: user.address,
                    state: user.state,
                    pincode: user.pincode,
                    city: user.city,

                }
            }
            ).then((resp) => {
                res(resp)
            })

        })

    },
    updateprofileImage: (profile, files, user, callback) => {
        let Img = files.map((info, index) => {
            return files[index].filename
        })

        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(user) }, {
            $set: {
                image: Img
            }


        }).then((response) => {
            callback(response.insertedId)
        })

    },
    generateRazorpay: (orderId, total) => {
        return new promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log("high", order);
                } else {
                    resolve(order)
                }


            })
        })
    },
    verifyPayment: (details) => {
        return new promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'MLgjh2yaPXkedjkUXQzImWR9')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'

                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },
    relatedProducts: (categoryId) => {
        return new promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: categoryId })
                .toArray();
            resolve(category);
        });
    },

    getAllBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    }, 
    // coupon
    checkcoupon: (couponId) => {
        console.log("mnnnn");
        return new promise(async (resolve, reject) => {
            let coupon = await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .findOne({ coupon: couponId });
            resolve(coupon);
        });
    },
    checkuser: (userid, couponId) => {
        console.log(couponId);
        return new promise(async (resolve, reject) => {
            let user = await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .findOne({
                    coupon: couponId,
                    user: {
                        $elemMatch: {
                            userId: objectId(userid),
                        },
                    },
                });
            resolve(user);
        });
    },
    updatcoupon: (userID, code) => {
        let obj = {
            userId: objectId(userID),
        };
        return new promise(async (resolve, reject) => {
            await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .updateOne(
                    { coupon: code },
                    {
                        $push: { user: obj },
                    }
                )
                .then((response) => {

                    resolve(response);
                });
        });
    },
    checkReferal: (referal) => {
        return new Promise(async (res, rej) => {
            let refer = await db.get().collection(collection.USER_COLLECTION).find({ refer: referal }).toArray();
            if (refer) {
                res(refer)
            } else {
                res(err)
            }
        });
    },
    // wallet
    applayWallet: (val, userId) => {
        let value = parseInt(val)
        return new promise((res, rej) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $inc: { wallet: -value } }).then((response) => {
                res(response)
            })

        })

    },

    addWallet: (userId, total) => {
        let Total = parseInt(total)
        return new Promise((res, rej) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $inc: { wallet: Total } }).then((response) => {
                res(response)
            })
        })

    },
    updatedatef: (date) => {
        return new promise((resolve, reject) => {
            db.get()
                .collection(collection.COUPON_COLLECTION)
                .deleteOne({ expiry: date })
                .then((response) => {
                    resolve(response);
                });
        });
    },
    // invoice
    getorderdetails: (id) => {
        return new promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: objectId(id) }).toArray()
            resolve(orders)
        })


    },

    getinvoiceproductDetails: (id) => {

        return new promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(id) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(cartItems)
        })

    }

}