let db = require('../confiq/connection')
let collection = require('../confiq/collection');
let bcrypt = require('bcrypt');
let objectId = require('mongodb').ObjectId

let promise = require('promise');
const async = require('hbs/lib/async');
const moment = require('moment');
const { resolve, reject } = require('promise');
const { response } = require('express');
const userHepers = require('./user-hepers');
module.exports = {
    addproduct: (product, files, callback) => {
        let Img = files.map((info, index) => {
            return files[index].filename
        })
        console.log("jjjj", Img);
        product.img = Img
        console.log(product);
        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data);
            callback(data.insertedId)
        })

    },
    getAllproducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getAllcategory: () => {
        return new promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.PRODUCT_CATEGORY).find().toArray()
            resolve(category)
        })
    },


    deleteProduct: (proid) => {
        return new promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proid) }).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    getAllproductsDetails: (proid) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proid) }).then((product) => {
                resolve(product)
            })
        })
    },


    updateProduct: (proid, prodetails) => {
        console.log(prodetails);
        return new promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proid) }, {
                $set: {
                    brand: prodetails.brand,
                    description: prodetails.description,
                    category: prodetails.category,
                    orginalPrice: prodetails.orginalPrice,
                    offerPrice: prodetails.offerPrice,
                    offerpercentage: prodetails.offerpercentage

                }
            }).then((response) => {
                resolve(response)
            })

        })

    },

    addcategory: (category) => {

        return new promise((resolve, reject) => {
            db.get().collection('category').insertOne(category).then((data) => {
                resolve(data.insertedId);
            })
        })
    },

    deleteCategory: (cateId) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_CATEGORY).deleteOne({ _id: objectId(cateId) }).then((response) => {
                console.log(response);
                resolve(response)

            })
        })
    },
    getAllcategoryDetails: (cateId) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_CATEGORY).findOne({ _id: objectId(cateId) }).then((category) => {
                resolve(category)
            })
        })
    },
    updateCategory: (catId, catDetails) => {
        console.log(catId);
        console.log(catDetails);
        return new promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_CATEGORY).updateOne({ _id: objectId(catId) }, {
                $set: {
                    brand: catDetails.brand,
                    category: catDetails.category
                }
            })
                .then((response) => {
                    console.log(response);
                    resolve(response)

                })
        })
    },
    getAllUsers: () => {
        return new promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUsers: (id) => {
        console.log(id);
        return new promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    userBlock: true
                }
            }).then((data) => {
                resolve(data)
            })
        })
    },
    unblockUser: (id) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    userBlock: false

                }
            }).then((data) => {
                resolve(data)
            })
        })

    },
    deleteUsers: (id) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },
    getAllorders: () => {
        return new promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ _id: -1 }).toArray()
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
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
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(orderItems)
        })

    },
    statusUpdate: (status, orderId) => {
        return new promise((resolve, reject) => {

            if (status == "Delivered") {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        Cancelled: false,
                        Delivered: true
                    }

                })
            }
            else if (status == "Cancelled") {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,
                        Cancelled: true,
                        Delivered: false
                    }

                })
            } else {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: status,




                    }
                }).then((response) => {
                    resolve(true)
                })

            }

        })
    },
    getBanner: () => {
        return new promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },

    addBanner: (banner, files, callback) => {
        let Img = files.map((info, index) => {
            return files[index].filename
        })
        banner.img = Img

        db.get().collection('banner').insertOne(banner).then((data) => {

            callback(data.insertedId)
        })
    },
    deleteBanner: (bannerId) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: objectId(bannerId) }).then((response) => {
                console.log(response);
                resolve(response)

            })
        })
    },
    // grphs
    getdailyIncome: () => {
        return new promise(async (resolve, reject) => {
            let dailySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }
                },

                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$DateIso" } },
                        totalAmount: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                },
                {
                    $limit: 7
                }
            ]).toArray()
            console.log("daily", dailySale);
            resolve(dailySale)
        })
    },
    getCurrentDaySale: () => {
        return new promise(async (resolve, reject) => {
            let currentDate = new Date
            currentDate = currentDate.toISOString().split('T')[0]
            let todaySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }
                },
                {
                    $project: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$DateIso" } }, totalAmount: 1
                    }
                },
                {
                    $match: { DateIso: currentDate }
                },
                {
                    $group: {
                        _id: "$DateIso",
                        total: { $sum: "$totalAmount" },

                    }
                }


            ]).toArray()
            let data = 0
            todaySale.map(val => data = val.total)
            resolve(data)
        })
    },
    getYearlySale: () => {

        let curDate = new Date
        let currentYear = curDate.getFullYear();
        currentYear = currentYear + ""

        return new promise(async (resolve, reject) => {

            let yearlySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }
                },
                {
                    $project: {
                        DateIso: { $dateToString: { format: "%Y", date: "$DateIso" } }, totalAmount: 1
                    }
                },

                {
                    $group: {
                        _id: "$DateIso",
                        total: { $sum: "$totalAmount" },

                    }
                }


            ]).toArray()
            console.log("Yearly", yearlySale);
            resolve(yearlySale)
        })
    },
    countsalemonth: () => {
        return new promise(async (resolve, reject) => {
            let dailySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        "status": "Delivered"
                    }
                },

                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: '$DateIso' } },
                        totalAmount: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                },

            ]).toArray()
            console.log(dailySale);
            resolve(dailySale)
        })

    },


    // report
    monthlyReport: () => {
        return new promise(async (res, rej) => {
            let today = new Date()
            let end = moment(today).format('YYYY/MM/DD')
            let start = moment(end).subtract(30, 'days').format('YYYY/MM/DD')
            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }).toArray()

            let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let orderSuccessLength = orderSuccess.length
            let orderTotalLength = orderTotal.length
            let orderFailLength = orderTotalLength - orderSuccessLength
            let total = 0;
            let paypal = 0;
            let razorpay = 0;
            let cod = 0;
            for (let i = 0; i < orderSuccessLength; i++) {
                total = total + orderSuccess[i].totalAmount;
                if (orderSuccess[i].paymentMethode == 'PAYPAL') {
                    paypal++;
                } else if (orderSuccess[i].paymentMethode == 'ONLINE') {
                    razorpay++;
                } else if (orderSuccess[i].paymentMethode == 'COD') {
                    cod++;
                }
            }
            var data = {
                start: start,
                end: end,
                totalOrders: orderTotalLength,
                successOrders: orderSuccessLength,
                failedOrders: orderFailLength,
                totalSales: total,
                cod: cod,
                paypal: paypal,
                razorpay: razorpay,
                currentOrders: orderSuccess
            }
            // console.log(data);
            res(data)
        })
    },

    salesReport: (date) => {
        return new promise(async (res, rej) => {

            let end = moment(date.EndDate).format('YYYY/MM/DD')
            let start = moment(date.StartDate).format('YYYY/MM/DD')

            let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }).toArray()
            let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ date: { $gte: start, $lte: end } }).toArray()
            let orderSuccessLength = orderSuccess.length
            let orderTotalLength = orderTotal.length
            let orderFailLength = orderTotalLength - orderSuccessLength
            let total = 0;
            let paypal = 0;
            let razorpay = 0;
            let cod = 0;
            for (let i = 0; i < orderSuccessLength; i++) {
                total = total + orderSuccess[i].totalAmount;
                if (orderSuccess[i].paymentMethod == 'PAYPAL') {
                    paypal++;
                } else if (orderSuccess[i].paymentMethod == 'ONLINE') {
                    razorpay++;
                } else {
                    cod++;

                }
            }
            var data = {
                start: start,
                end: end,
                totalOrders: orderTotalLength,
                successOrders: orderSuccessLength,
                failedOrders: orderFailLength,
                totalSales: total,
                cod: cod,
                paypal: paypal,
                razorpay: razorpay,
                currentOrders: orderSuccess
            }
            res(data)
        })

    },
    TotalOders: () => {
        return new promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                { $group: { _id: null, count: { $sum: 1 } } },
                { $project: { _id: 0 } }
            ]).toArray()
            console.log(total);
            resolve(total)

        })
    },
    Totalsales: () => {
        return new promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }
                },
                { $group: { _id: null, count: { $sum: 1 } } },
                { $project: { _id: 0 } }
            ]).toArray()
            console.log(total);
            resolve(total)

        })

    },
    Totalprofit: () => {
        return new promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }
                },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } },
                { $project: { _id: 0 } }
            ]).toArray()
            console.log(total);
            resolve(total)

        })


    },
    Totalusers: () => {
        return new promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.USER_COLLECTION).aggregate([
                { $group: { _id: null, count: { $sum: 1 } } },
                { $project: { _id: 0 } }
            ]).toArray()
            console.log(total);
            resolve(total)

        })

    },
    // category offer
    getAllCategoryOffer: () => {
        return new promise(async (resolve, reject) => {
            let catOffer = await db.get().collection(collection.CATEGORY_OFFER).find().toArray()
            resolve(catOffer)
        })
    },
    addCategoryOffer: (data) => {
        return new promise(async (resolve, reject) => {
            data.startDateIso = new Date(data.startDate)
            data.endDate = new Date(data.expiryDate)
            discount = parseInt(data.discount)
            db.get().collection(collection.CATEGORY_OFFER).insertOne(data).then((response) => {
                resolve(response)
            })

        })
    },
    startCategoryOffer: (date) => {
        let catStartDateIso = new Date(date);
        console.log('this is a category offer.................... ', date);
        return new promise(async (res, rej) => {
            let data = await db.get().collection(collection.CATEGORY_OFFER).find({ startDateIso: { $lte: catStartDateIso } }).toArray();
            // console.log("data", data);
            if (data.length > 0) {
                await data.map(async (onedata) => {
                    // console.log("onedata", onedata);
                    let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: onedata.offerProduct, }).toArray();
                    // console.log("products", products);
                    await products.map(async (product) => {
                        let ogPrice = product.orginalPrice
                        let actualPrice = product.orginalPrice
                        let newPrice = (((product.orginalPrice) * (onedata.discount)) / 100)
                        newPrice = newPrice.toFixed()
                        console.log(actualPrice, newPrice, onedata.discount);
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                            {
                                $set: {
                                    orginalPrice: ogPrice,
                                    // offerPrice:actualPrice,
                                    offerPrice: (actualPrice - newPrice),
                                    offer: true,
                                    catOfferPercentage: onedata.discount
                                }
                            })
                    })
                })
                res();
            } else {
                res()
            }

        })

    },
    deleteCategoryOffer: (id) => {
        console.log(id);
        return new promise(async (res, rej) => {
            let categoryOffer = await db.get().collection(collection.CATEGORY_OFFER).findOne({ _id: objectId(id.offerId) })
            let catName = categoryOffer.offerProduct
            console.log("eeeee", categoryOffer);
            console.log("wwww", catName);
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: catName }, { offer: { $exists: true } }).toArray()
            if (product) {
                db.get().collection(collection.CATEGORY_OFFER).deleteOne({ _id: objectId(id.offerId) }).then(async () => {
                    await product.map((product) => {
                        console.log(product);
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) }
                            , {

                                $set: {
                                    offerPrice: product.orginalPrice

                                },

                                $unset: {
                                    offer: "",
                                    catOfferPercentage: '',
                                    // offerPrice: ''
                                }

                            }).then(() => {
                                res()
                                console.log("iii", res);
                            })
                    })
                })
            } else {
                res()
            }

        })

    },

    // coupon
    getAllCoupons: () => {
        return new promise(async (resolve, reject) => {
            let AllCoupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(AllCoupons)
        })
    },
    addCoupon: (data) => {
        return new promise(async (resolve, reject) => {
            let endDateIso = new Date(data.expirydate)
            let expiry = await moment(data.expirydate).format('YYYY-MM-DD')
            let = dataobj = {
                coupon: data.coupon,
                discount: parseInt(data.discount),
                expiry: expiry,
                endDateIso: endDateIso,
                users: []
            }
            await db.get().collection(collection.COUPON_COLLECTION).insertOne(dataobj).then((data) => {
                resolve()
            }).catch((err) => {
                res(err)
            })
        })
    },
    deleteCoupon: (couponId) => {
        return new promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((response) => {
                console.log(response);
                resolve(response)

            })
        })
    },



}