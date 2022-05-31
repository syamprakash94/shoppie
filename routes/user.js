const { response } = require("express");
var express = require("express");
const async = require("hbs/lib/async");
const { Db } = require("mongodb");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-hepers");
require('dotenv').config()

const serviceSsid = process.env.OTP_SERVICEID
const AccountSsid = process.env.OTP_ACCOUNTID

const token = process.env.OTP_TOKENID
const client = require("twilio")(AccountSsid, token);
const paypal = require('paypal-rest-sdk')
let createReferal = require('referral-code-generator');
const upload = require("../confiq/multer");
const moment = require('moment');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_ID,
  'client_secret': process.env.PAYPAL_SECRET
});

const verifylogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  req.session.discount = 0
  req.session.coupon = 0
  req.session.walletTotal = 0

  let todayDate = new Date().toISOString().slice(0, 10)
  var today = new Date();
  let expiry = await moment(today).format('YYYY-MM-DD')
  userHelpers.updatedatef(expiry).then((response) => { });

  cartCount = null
  if (req.session.user) {
    var cartCount = await userHelpers.getCarCount(req.session.user._id)
    var wishCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  let banner = await userHelpers.getAllBanner();
  productHelpers.getAllproducts().then((products) => {
    productHelpers.getAllcategory().then((category) => {
      productHelpers.startCategoryOffer(todayDate).then(() => {
        res.render("user/view-products", { banner, products, user, category, cartCount, wishCount });
      });
    });
  });
});

// login
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session?.loginErr });
    req.session.loginErr = false;
  }
});

// signup
router.get("/signup", async (req, res) => {
  let refer = (await req.query.refer) ? req.query.refer : null;
  res.render("user/signup", { refer });
});

router.post("/signup", (req, res) => {
  let email = req.body.email;
  let phone = req.body.phoneNumber;
  let refer = createReferal.alphaNumeric("uppercase", 2, 3);
  req.body.refer = refer;
  if (req.body.referedBy != "") {
    userHelpers
      .checkReferal(req.body.referedBy)
      .then((data) => {
        req.body.referedBy = data[0]._id;
        req.body.wallet = 100;
        userHelpers.emailCheck(email, phone).then((resolve) => {
          if (resolve) {
            if (resolve.phoneNumber == phone) {
              res.render("user/signup", { phone: true, phoneAll: "phone invaid" });
              phoneAll = false;
            } else {
              res.render("user/signup", { email: true });
              email = false;
            }
          } else {
            userHelpers.doSignup(req.body).then((response) => {
              // console.log(response);
              res.redirect("/login");
            });
          }
        });
      })
  } else {
    userHelpers.emailCheck(email, phone).then((resolve) => {
      if (resolve) {
        if (resolve.phoneNumber == phone) {
          res.render("user/signup", { phone: true, phoneAll: "phone invaid" });
          phoneAll = false;
        } else {
          res.render("user/signup", { email: true });
          email = false;
        }
      } else {
        userHelpers.doSignup(req.body).then((response) => {
          res.redirect("/login");
        });
      }
    });
  }

});

// login post
router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.userBlock) {
      res.render("user/login", { userBlock: true });
    } else {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = true;
        res.redirect("/login");
      }
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});


//cart routes
router.get("/cart", verifylogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  let user1 = await userHelpers.getProfile(req.session.user._id)
  if (products <= 0) {
    res.render("user/empty-cart", { user: req.session.user })
  } else {
    cartCount = null
    if (req.session.user) {
      var cartCount = await userHelpers.getCarCount(req.session.user._id)
    }
    res.render("user/cart", { products, user: req.session.user, cartCount, totalValue, user1 });
  }
});

router.get('/add-to-cart/:id', verifylogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.get('/add-to-wishlist/:id', verifylogin, (req, res) => {
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})


// view image
router.get("/view-image/:id", verifylogin, async (req, res) => {
  var imgId = req.params.id;
  let product = await userHelpers.imageDetails(imgId);
  var cartCount = await userHelpers.getCarCount(req.session.user?._id)
  let relCat = product.category;
  let relProducts = await userHelpers.relatedProducts(relCat);
  res.render("user/view-image", { product, user: req.session.user, cartCount, relProducts });
});

//otp verfication

router.get("/verify-phone", (req, res) => {
  res.render("user/verify-phone");
});
router.post("/verify-phone", (req, res) => {
  let phone = req.body.phoneVerify;
  userHelpers.checkPhone(phone).then((number) => {
    if (number) {
      if (number.userBlock) {
        res.render("user/verify-phone", { userBlock: true });
      } else {
        if (number) {
          let phone = number.phoneNumber;
          client.verify
            .services(serviceSsid)
            .verifications.create({ to: `+91${phone}`, channel: "sms" })
            .then((resp) => {
            });
          res.render("user/verify-otp", { phone });
        } else {
          res.render("user/verify-phone", { number: true });
          number = false;
        }
      }
    } else {
      res.render("user/verify-phone", { number: true });
      number = false;
    }
  });
});

router.post("/verify-otp/:phone", (req, res) => {
  let phone = req.params.phone;
  let otp = req.body.phoneVerify;
  client.verify
    .services(serviceSsid)
    .verificationChecks.create({
      to: `+91${phone}`,
      code: otp,
    })
    .then((resp) => {
      const user = resp.valid;

      if (user) {
        userHelpers.doLoginOtp(phone).then((response) => {
          if (response) {
            req.session.loggedIn = true;
            req.session.user = response;
            res.redirect("/");
          } else {
            req.session.loginErr = true;
            res.redirect("/login");
          }
        });
        req.session.loggedIn = true;
        req.session.user = response.user;
      } else {
        res.render("user/verify-otp", { phone, number: true });
        number = false;
      }
    });
});

router.get('/resent-otp/:phone', (req, res) => {
  let phone = req.params.phone

  client.verify
    .services(serviceSsid)
    .verifications.create({ to: `+91${phone}`, channel: "sms" })
    .then((resp) => {
    });
  res.render("user/verify-otp", { phone });
})

//category view
router.get('/view-category/:id', verifylogin, async (req, res) => {
  let category = req.params.id
  var cartCount = await userHelpers.getCarCount(req.session.user?._id)
  var wishCount = await userHelpers.getWishlistCount(req.session.user?._id);
  userHelpers.categoryView(category).then((products) => {

    res.render('user/view-category', { products, user: req.session.user, cartCount, wishCount })
  })

})



// quantity
router.post('/change-product-quantity', verifylogin, (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})


router.post('/remove-product-cart', verifylogin, (req, res) => {
  userHelpers.removeCartProduct(req.body).then((response) => {
    res.json(response)
  })
})

// address selection
router.get('/address-selection', verifylogin, async (req, res) => {
  let address = await userHelpers.getAddressDetails(req.session.user?._id)
  var total = await userHelpers.getTotalAmount(req.session.user?._id)
  if (req.session.walletTotal || req.session.coupon) {
    if (req.session.coupon > 0) {
      var total = req.session.coupon
    }
    if (req.session.walletTotal) {
      total = req.session.walletTotal
    }
  } else {
    total = await userHelpers.getTotalAmount(req.session.user?._id)
  }
  res.render('user/address-selection', { total, user: req.session.user, address })
})



router.post('/address-selection', verifylogin, async (req, res) => {

  let products = await userHelpers.getCartProductList(req.session.user?._id)
  if (req.session.walletTotal || req.session.coupon) {
    if (req.session.coupon > 0) {
      var totalPrice = req.session.coupon
    }
    if (req.session.walletTotal) {

      totalPrice = req.session.walletTotal
      console.log(req.session.walletTotal, "ttttttt");
    }
  } else {
    totalPrice = await userHelpers.getTotalAmount(req.session.user?._id)
  }
  let user = await userHelpers.getProfile(req.session.user?._id)
  let address = await userHelpers.getUserAddressDetails(req.query.addressId, req.session.user._id)
  userHelpers.placeOrderr(address, products, totalPrice, req.query.payment, user).then((orderId) => {
    if (req.query.payment === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.query.payment === "PAYPAL") {
      console.log("entered to paypal");
      if (req.session.wallet > 0) {
        totalPrice = req.session.wallet
      }
      console.log("lkjhgfdsdfghjk", totalPrice);
      val = totalPrice / 74;
      totalPrice = val.toFixed(2);
      let totals = totalPrice.toString();
      req.session.total = totals;

      var create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/order-success",
          "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "item",
              "sku": "001",
              "price": totals,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": totals
          },
          "description": "This is the payment description."
        }]
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        }
        else {
          for (var i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              let link = payment.links[i].href;
              link = link.toString()
              res.json({ paypal: true, url: link })
            }
          }
        }
      })
    }
    else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }

  })
})



// add address
router.get('/addNewAddress', verifylogin, async (req, res) => {
  if (req.session.walletTotal || req.session.coupon) {
    if (req.session.coupon > 0) {
      var total = req.session.coupon
    }
    if (req.session.walletTotal) {
      total = req.session.walletTotal
    }
  } else {

    total = await userHelpers.getTotalAmount(req.session.user?._id)
  }
  res.render('user/Add-address', { total, user: req.session.user })
})

router.post('/addNewAddress', verifylogin, async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  if (req.session.walletTotal || req.session.coupon) {
    if (req.session.coupon > 0) {
      var totalPrice = req.session.coupon
    }
    if (req.session.walletTotal) {
      totalPrice = req.session.walletTotal
    }
  } else {

    totalPrice = await userHelpers.getTotalAmount(req.session.user?._id)
  }
  let user = await userHelpers.getProfile(req.session.user._id)
  userHelpers.placeOrder(req.body, products, totalPrice, user).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['payment-method'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
    else if (req.body['payment-method'] === "PAYPAL") {
      val = totalPrice / 74;
      totalPrice = val.toFixed(2);
      let totals = totalPrice.toString();
      req.session.total = totals;
      var create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/order-success",
          "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "item",
              "sku": "001",
              "price": totals,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": totals
          },
          "description": "This is the payment description."
        }]
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        }
        else {
          for (var i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              let link = payment.links[i].href;
              link = link.toString()

              res.json({ paypal: true, url: link })
            }
          }
        }
      })
    }

  })
})

router.get('/order-success', verifylogin, (req, res) => {
  req.session.walletTotal = 0
  req.session.coupon = 0
  res.render('user/order-success', { user: req.session.user })
})




router.get('/orders', verifylogin, async (req, res) => {

  let orders = await userHelpers.getUserOrders(req.session.user?._id)
  res.render('user/orders', { user: req.session.user, orders })
})
router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)

  res.render('user/product-detail', { user: req.session.user, products })
})

// cancel order
router.get('/cancel-order/:id', verifylogin, (req, res) => {

  let orderId = req.params.id
  userHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/orders')
  })
})

// user profile
router.get('/user-profile/', verifylogin, async (req, res) => {

  let profile = await userHelpers.getProfile(req.session.user._id)
  let user = await userHelpers.getProfile(req.session.user?._id)
  console.log(user, "ggggg");
  let refer = user.refer


  let referalLink = "http://localhost:3000/signup?refer=" + refer;

  res.render("user/user-profile", { profile, user: req.session.user, referalLink })
})

// user profile address
router.get('/user-profile-address/', verifylogin, async (req, res) => {
  let address = await userHelpers.getAddressDetails(req.session.user?._id)

  res.render("user/user-profile-address", { address, user: req.session.user })
})


// remove user address
router.post('/remove-user-address', verifylogin, (req, res) => {

  userHelpers.removeUserAddress(req.body.address).then(() => {

    res.json(response)
  })

})

// edit user address


router.post('/edit-user-address/:id', verifylogin, (req, res) => {
  console.log("rrrrr", req.params.id, req.body);
  userHelpers.editUserAddress(req.params.id, req.body).then(() => {

    res.redirect('/user-profile-address');

  })
})
// edit user profile
router.get('/user-edit-profile', verifylogin, async (req, res) => {
  let profile = await userHelpers.getProfile(req.session.user?._id)
  res.render("user/user-edit-profile", { profile, user: req.session.user });
})

router.post('/user-edit-profile', verifylogin, (req, res) => {
  let userId = req.body.userId
  req.session.user.name = req.body.name
  userHelpers.updateProfileDetails(userId, req.body).then(() => {
    res.redirect('/user-profile')
  })
})
// chnange password
router.post('/user-edit-password', verifylogin, (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {

    if (response.status) {
      res.render('user/user-profile', { success: "password Changed Successfully", user: req.session.user })
    } else {

      let errorMsg = response.err;
      let user = req.session.user
      res.render('user/user-edit-profile', { errorMsg, user })
    }

  })
})
router.post('/user-edit-profile/:id', verifylogin, (req, res) => {

  userHelpers.editProfileDetails(req.params.id, req.body).then(() => {

    res.redirect('/user-profile');

  })
})
// edit profile image
router.post('/edit-profilepic', verifylogin, upload.array('image', 12), (req, res) => {

  let user = req.session.user._id
  userHelpers.updateprofileImage(req.body, req.files, user, (id) => {
    res.redirect('/user-profile')
  })



})

router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
})


// coupons
router.post("/applycoupon", async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let userId = req.session.user._id;
  let amount = total
  let code = req.body.code;
  let coupon = await userHelpers.checkcoupon(code);
  if (coupon) {
    let check = await userHelpers.checkuser(userId, code);
    if (check) {
      res.json({ user: true });
    } else {
      userHelpers.updatcoupon(userId, code).then((response) => {
        let discountVal = ((amount * coupon.discount) / 100).toFixed();
        req.session.discount = discountVal;
        let offerprice = amount - discountVal;
        req.session.coupon = offerprice
        res.json({ offerprice, discountVal });
      });
    }
  } else {
    res.json(response);
  }
});

// wallet

router.post("/applayWallet", async (req, res) => {
  var user = req.session.user._id;
  let ttl = parseInt(req.body.Total);
  let walletAmount = parseInt(req.body.wallet);
  let userDetails = await userHelpers.getProfile(user);
  if (userDetails.wallet >= walletAmount) {
    let total = ttl - walletAmount;
    req.session.wallet = total
    userHelpers.applayWallet(walletAmount, user).then(() => {
      req.session.walletTotal = total;
      res.json({ walletSuccess: true, total, walletAmount });
    });
  } else {
    res.json({ valnotCurrect: true });
  }
});

// wishlistwish
router.get('/wishlist', async (req, res) => {
  let wishilistItems = await userHelpers.getwishilistProducts(
    req.session.user?._id
  );
  if (wishilistItems <= 0) {
    res.render("user/empty-wishlist", { user: req.session.user })
  } else {
    wishlistCount = null
    res.render('user/wishlist', { wishilistItems, user: req.session.user?._id });
  }


})



router.post('/remove-wishlist', (req, res) => {
  let wishlistId = req.body
  console.log(wishlistId, "rrrr");
  userHelpers.deleteWishlist(wishlistId).then((response) => {
    res.json({ status: true })
  })

})


// invoice
router.get('/invoice/:id', async (req, res) => {
  let productss = await userHelpers.getorderdetails(req.params.id)

  let order = await userHelpers.getinvoiceproductDetails(req.params.id)

  let user = req.session?.user;
  let products = productss[0]
  res.render('user/invoice', { products, user, order })
})


















module.exports = router;
