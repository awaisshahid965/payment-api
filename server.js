const http = require("https");
const express = require('express')
const app = express()
const port = process.env.PORT || 8080;
const fs = require('fs');

// Host static html pages and JavaScripts
// from the "public" subdirectory
app.use(express.static('public'))


let dataPayment = {};
app.get('/create-payment', (req, res) => {

	const options = {
		"method": "POST",
		"hostname": "test.api.dibspayment.eu",
		"port": null,
		"path": "/v1/payments",
		"headers": {
			"content-type": "application/json",
			"Authorization": "test-secret-key-d59296475abe46daaae76cb966b176d6"
		}
	};

	const redirect_to_checkout = function(data) {
		var json;
		try {
			json = JSON.parse(data);
		} catch (e) {
			console.error(e);
			res.send("Unable to parse json response");
			return;
		}
		console.log(json)
		const url = json.hostedPaymentPageUrl;
		if (!url) {
			console.error("Key hostedPaymentPageUrl not found");
			res.send("Could not find the key 'hostedPaymentPageUrl'");
			return;
		}
		const lang = 'en-GB'; // Default language
		url + "&language=" + 
		res.redirect(url + "&language=" + lang);
	}

	const restreq = http.request(options, function (resp) {
		const chunks = [];

		console.log("statusCode: ", resp.statusCode);
		console.log("headers: ", resp.headers);

		resp.on("data", function (chunk) {
			console.log("on data");
			chunks.push(chunk);
		});
		resp.on("end", function () {
			const body = Buffer.concat(chunks);
			console.log(body.toString())
			dataPayment = {};
			redirect_to_checkout(body);   // Perform redirect
		});
	});

	let payload = JSON.stringify(dataPayment);
	restreq.write(payload);
	// console.log(JSON.parse(payload));

	restreq.on('error', function (e) {
		console.error('error');
		console.error(e);

	});
	restreq.end();
});

app.get('/start-payment', (req, res) => {
	let { quantity, price, name } = req.query;
	price = parseFloat(price);
	quantity = parseFloat(quantity);
	let totalAmount = quantity * price;
	dataPayment = {
      "checkout": {
        "integrationType": "HostedPaymentPage",
        "returnUrl": `https://versabatt-7d822.web.app`,
        "termsUrl": `http://localhost:${port}/terms.html`
      },
      "order": {
        "items": [
          {
            "reference": "ref42",
            "name": name,
            "quantity": quantity,
            "unit": "hours",
            "unitPrice": price,
            "grossTotalAmount": totalAmount,
            "netTotalAmount": totalAmount
          },
        ],
        "amount": totalAmount,
        "currency": "NOK",
        "reference": name +" Order"
      }
    };
    res.redirect('/create-payment');
});

app.get('*', (req, res) => {
	res.send('Response Ok...');
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`)
})
