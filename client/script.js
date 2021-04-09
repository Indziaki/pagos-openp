// A reference to Stripe.js
var stripe, card;
var pub_key = "pk_test_QtnKj8xeytEomkWeqe63Clrg00nqat0kby";

var url = "https://cuponera-payment-api.azurewebsites.net/api";

function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
};

function createPaymentIntent(type) {
  var uri = url + "/Payment/charge/"+getUrlParameter("id");
  fetch(uri, {
    method: "GET"
  })
  .then(function(result) {
    return result.json();
  })
  .then(function(data) {
    if(type==0){
      payWithCard(data.client_secret);
    }
    else{
      payWithOxxo(data.client_secret);
    }
    /*document
      .querySelector("#submit-card")
      .addEventListener("click", function(evt) {
        // Initiate payment when the submit button is clicked
      });
    document
      .querySelector("#submit-card")
      .addEventListener("click", function(evt) {
        // Initiate payment when the submit button is clicked
      }, {once: true});*/
  });
}

//createPaymentIntent()
  document.querySelectorAll(".sr-pm-button").forEach(function(el) {
    el.addEventListener("click", function(evt) {
      // Handle switching between Card and OXXO
      var id = evt.target.id;
      if (id === "card-button") {
        showElement(".sr-payment-form.card");
        hideElement(".sr-payment-form.oxxo");
        document.querySelector("#card-button").classList.add("selected");
        document.querySelector("#oxxo-button").classList.remove("selected");
      } else {
        hideElement(".sr-payment-form.card");
        showElement(".sr-payment-form.oxxo");
        document.querySelector("#card-button").classList.remove("selected");
        document.querySelector("#oxxo-button").classList.add("selected");
      }
    });
  });

// Set up Stripe.js and Elements to use in checkout form
function setupElements() {
  stripe = Stripe(pub_key);
  var elements = stripe.elements({ locale: "es-419" }); // locale will translate placeholder
  var style = {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4"
      },
      padding: "10px 12px"
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a"
    }
  };

  card = elements.create("card", { style: style });
  card.mount("#card-element");
};

setupElements();

/* Called when customer pays with a card */
var payWithCard = function(clientSecret) {
  // Initiate the payment.
  // If authentication is required, confirmCardPayment will automatically display a modal
  changeLoadingState(true);

  stripe
    .confirmCardPayment(clientSecret, { payment_method: { card: card } })
    .then(function(result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
      }
      else{
        redirectToApp(result);
      }
    });
};

/* Called when customer pays with OXXO */
var payWithOxxo = function(clientSecret) {
  // Initiate the payment.
  // confirmOxxoPayment will create an OXXO voucher and return display details
  changeLoadingState(true);
  stripe
    .confirmOxxoPayment(
      clientSecret,
      {
        payment_method: {
          billing_details: {
            name: document.querySelector('input[name="name"]').value,
            email: document.querySelector('input[name="email"]').value
          }
        }
      }
    )
    .then(function(result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
      }
      else{
        redirectToApp(result);
      }
      changeLoadingState(false);
    });
};

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function(clientSecret) {
  stripe.retrievePaymentIntent(clientSecret).then(function(result) {
    var paymentIntent = result.paymentIntent;
    var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

    document.querySelector(".sr-payment-form.oxxo").classList.add("hidden");
    document.querySelector(".sr-payment-form.card").classList.add("hidden");
    document.querySelector("pre").textContent = paymentIntentJson;
    document.querySelector(".sr-picker").classList.add("hidden");
    document.querySelector(".sr-result-card").classList.remove("hidden");
    setTimeout(function() {
      document.querySelector(".sr-result-card").classList.add("expand");
    }, 200);

    changeLoadingState(false);
  });
};

var showError = function(errorMsgText) {
  changeLoadingState(false);

  var errorMsg = document.querySelector(".sr-field-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function() {
    errorMsg.textContent = "";
  }, 4000);
};

// Show a spinner on payment submission
var changeLoadingState = function(isLoading) {
  const selectedPaymentMethod = document.querySelector(".sr-pm-button.selected")
    .dataset.paymentmethod;

  const className = "." + selectedPaymentMethod;
  if (isLoading) {
    showElement(className + " #spinner");
    hideElement(className + " #button-text");
    document.querySelector(className + " .submit").disabled = true;
  } else {
    hideElement(className + " #spinner");
    showElement(className + " #button-text");
    document.querySelector(className + " .submit").disabled = false;
  }
};

var showElement = function(query) {
  document.querySelector(query).classList.remove("hidden");
};

var hideElement = function(query) {
  document.querySelector(query).classList.add("hidden");
};

function redirectToApp(result){
  var callback = "com.nuuxpiaani.cuponera";
  var id = getUrlParameter('id');
  if(result.paymentIntent.status=='succeeded'){
    window.location.href = callback + "?success=true&result="+id;
  }
  if(result.paymentIntent.status=='requires_action'){
    window.location.href = callback + "?success=true&result=oxxo_"+id;
  }
  else{
    window.location.href = callback + "?success=false&result=false";
  }
}
