$(function() {
  main();
});

function main() {
  const vscode = acquireVsCodeApi();

  $(document).ready(() => {
    addPropertiesAndBehaviorsForMainToken();

    vscode.postMessage({ command: 'documentReady'});
  });

  function addPropertiesAndBehaviorsForMainToken() {
    const htmlQuestionsOfSubTokens = getHtmlPropertiesAndBehaviorsForToken();

    $('#mainPropertiesAndBehaviorsToken')[0].innerHTML += htmlQuestionsOfSubTokens;
  }

  $('#yesAddCustomDetails').click(yesNoAddCustomDetails);
  $('#noAddCustomDetails').click(yesNoAddCustomDetails);

  $('#singleOrSolitary').click(showOrHideAdditionalOptionsForTokenType);
  $('#compositeOrHybrid').click(showOrHideAdditionalOptionsForTokenType);

  $('#numberOfSubTokens').change(addPropertiesAndBehaviorsForSubToken);

  $('#generateButton').click(generateToken);

  function generateToken() {
    if (!validateTokenForm()) {
      return null;
    }

    const tokenData = getTokenData();
    const tokenExpression = generateTokenExpression(tokenData);

    vscode.postMessage({ command: 'tokenExpression', value: JSON.stringify(tokenExpression)});
  }

  function getTokenData() {
    const mainPropertiesAndBehaviors = getPropertiesAndBehaviorsForToken('#mainPropertiesAndBehaviorsToken');
    const propertiesAndBehaviorsSubTokens = getPropertiesAndBehaviorsForSubTokens();

    const additionalBehaviorsData = $('input[name=otherBehaviors]:checked').val() === 'true'
      ? $('input[id=customBehaviors]').val()
      : null;

    const customMetaData = $('input[name=addCustomDetails]:checked').val() === 'true'
      ? $('input[id=customDetails]').val()
      : null;

    return {
      additionalBehaviorsData,
      behaviors: mainPropertiesAndBehaviors,
      composite: $('input[name=tokenType]:checked').val() === 'true',
      customMetaData,
      name: $('#tokenName')[0].value,
      subTokens: propertiesAndBehaviorsSubTokens,
    };
  }

  function isAllRequiredFieldsFilled() {
    const tokenName = $('#tokenName')[0].value;
    let isValid = true;

    if (!tokenName) {
      isValid = false;
    }

    const selectedTokenType = $('input[name=tokenType]:checked');

    if(!selectedTokenType.length) {
      $('#tokenType')[0].className = 'notificationForRequiredFields';
      isValid = false;
    } else {
      $('#tokenType')[0].className = '';
    }

    const isComposite = selectedTokenType.val() === 'true';
    if (isComposite) {
      const elementWrapperForSubTokens = '.propertiesAndBehaviorsSubToken';
      const countOfSubTokens = $(elementWrapperForSubTokens).length;

      for (let i = 1; i <= countOfSubTokens; i++) {
        const isSelectedAllBehaviors = checkSelectedAllBehaviors(elementWrapperForSubTokens, i);
        if (!isSelectedAllBehaviors) {
          isValid = false;
        }
      }
    }

    const elementWrapperForToken = '#mainPropertiesAndBehaviorsToken';
    const isSelectedAllBehaviors = checkSelectedAllBehaviors(elementWrapperForToken);

    if (!isSelectedAllBehaviors) {
      isValid = false;
    }

    const isValidCustomDetails = checkCustomBehaviorsAndDetails('addCustomDetails', 'customDetails');

    return isValid && isValidCustomDetails;
  }

  function checkSelectedAllBehaviors(elementWrapper, id = '') {
    const numberOfBehaviors = $(`${elementWrapper} input`).length / 2;
    const numberOfSelectedBehaviors = $(`${elementWrapper} input:checked`).length;

    addNotificationForToken(elementWrapper, id);

    return numberOfSelectedBehaviors !== numberOfBehaviors ? false : true;
  }

  function addNotificationForToken(elementWrapper, id) {
    $(`${elementWrapper} input[name=baseTokenType${id}]`).parent().parent()[0].className =
      $(`${elementWrapper} input[name=baseTokenType${id}]:checked`).length
      ? ''
      : 'notificationForRequiredFields';

    $(`${elementWrapper} input[name=additionalTokens${id}]`).parent().parent()[0].className =
      $(`${elementWrapper} input[name=additionalTokens${id}]:checked`).length
      ? ''
      : 'notificationForRequiredFields';

    $(`${elementWrapper} input[name=destroyTokens${id}]`).parent().parent()[0].className =
      $(`${elementWrapper} input[name=destroyTokens${id}]:checked`).length
      ? ''
      : 'notificationForRequiredFields';

    $(`${elementWrapper} input[name=transferOwnershipTokens${id}]`).parent().parent()[0].className =
      $(`${elementWrapper} input[name=transferOwnershipTokens${id}]:checked`).length
      ? ''
      : 'notificationForRequiredFields';

    $(`${elementWrapper} input[name=delegateInteractions${id}]`).parent().parent()[0].className =
      $(`${elementWrapper} input[name=delegateInteractions${id}]:checked`).length
      ? ''
      : 'notificationForRequiredFields';
  }

  function checkCustomBehaviorsAndDetails(typeCustomProperty, typeDetails) {
    const selectedCustomProperty = $(`input[name=${typeCustomProperty}]:checked`);
    if(selectedCustomProperty.length) {
      $('#addCustomDetails')[0].className = '';
      const isYes = selectedCustomProperty.val() === 'true';

      if (isYes && !$(`input#${typeDetails}`).val()) {
        return false;
      }
    } else {
      $('#addCustomDetails')[0].className = 'notificationForRequiredFields';
      return false;
    }

    return true;
  }

  function getPropertiesAndBehaviorsForToken(elementWrapper, id = '') {
    const isFungible = $(`${elementWrapper} input[name=baseTokenType${id}]:checked`).val();
    const isMintable = $(`${elementWrapper} input[name=additionalTokens${id}]:checked`).val();
    const isBurnable = $(`${elementWrapper} input[name=destroyTokens${id}]:checked`).val();
    const isTransferable = $(`${elementWrapper} input[name=transferOwnershipTokens${id}]:checked`).val();
    const isDelegate = $(`${elementWrapper} input[name=delegateInteractions${id}]:checked`).val();

    return {
      fungible: isFungible === 'true',
      mintable: isMintable === 'true',
      burnable: isBurnable === 'true',
      transferable: isTransferable === 'true',
      delegable: isDelegate === 'true',
    };
  }

  function getPropertiesAndBehaviorsForSubTokens() {
    let subTokensBehaviorsArray = [];
    const elementWrapper = '.propertiesAndBehaviorsSubToken';
    const countOfSubTokens = $(elementWrapper).length;

    for (let i = 1; i <= countOfSubTokens; i++) {
      subTokensBehaviorsArray.push(getPropertiesAndBehaviorsForToken(elementWrapper, i));
    }

    return subTokensBehaviorsArray;
  }

  function generateTokenExpression(tokenData) {
    let template = getTokenString(tokenData.behaviors);

    if (tokenData.customMetaData !== null) {
      const customMetaData =  tokenData.customMetaData.split(',').map(x => 'str' + x.trim()).join('+');
      template = '[' + template.trim() + '+' + customMetaData + ']';
    }

    const subTokens = tokenData.subTokens;
    if (subTokens && subTokens.length > 0) {
      template = template.concat('(');
      template = template.concat(subTokens.map(subToken => getTokenString(subToken)).join(','));
      template = template.concat(')');
    }

    return `{"TokenName":"${tokenData.name}","Template":"${template}"}`;
  }

  function getTokenString(behaviors) {
    const behaviorStrings = [];
    let template = '';

    template = behaviors.fungible ? template.concat('tF{') : template.concat('tN{');

    behaviorStrings.push(behaviors.mintable ? 'm' : '~m');
    behaviorStrings.push(behaviors.burnable ? 'b' : '~b');
    behaviorStrings.push(behaviors.transferable ? 't' : '~t');

    if (behaviors.delegable) {
      behaviorStrings.push('g');
    }

    template = template.concat(behaviorStrings.join(',')).concat('}');
    return template;
  }

  function yesNoAddCustomDetails() {
    const isYes = $('#yesAddCustomDetails')[0];

    if (isYes.checked) {
      $('#customDetails')[0].style.display = 'block';
    } else {
      $('#customDetails')[0].style.display = 'none';
      $('#customDetailsValidationTip')[0].style.display = 'none';
    }
  }

  function showOrHideAdditionalOptionsForTokenType() {
    const isCompositeOrHybrid = $('#compositeOrHybrid')[0];

    if (isCompositeOrHybrid.checked) {
      $('#selectionOfSubTokens')[0].style.display = 'block';
      addPropertiesAndBehaviorsForSubToken();
    } else {
      $('#selectionOfSubTokens')[0].style.display = 'none';
      removePropertiesAndBehaviorsForSubToken();
    }
  }

  function addPropertiesAndBehaviorsForSubToken() {
    let htmlOfPropertiesAndBehaviorsSubTokens = '';
    const numbersOfSubTokens = $('#numberOfSubTokens')[0].value;

    for(let i = 1; i <= numbersOfSubTokens; i++) {

      htmlOfPropertiesAndBehaviorsSubTokens +=
        '<div class="propertiesAndBehaviorsSubToken" style="margin: 20px 0 20px 0;">' +
        '<label>Please choose properties and behaviors for your sub token #' + i + '</label>' +
        getHtmlPropertiesAndBehaviorsForToken(i) +
        '</div>';
    }

    $('#propertiesAndBehaviorsSubTokens')[0].innerHTML = htmlOfPropertiesAndBehaviorsSubTokens;
  }

  function removePropertiesAndBehaviorsForSubToken() {
    $('#propertiesAndBehaviorsSubTokens')[0].innerHTML = '';
  }

  function validateCustomDetails() {
    const isAddCustomDetailsSelected = $('input[name=addCustomDetails]:checked').val() === 'true';
    const value = $('#customDetails')[0].value;
    let isValid = true;

    if (isAddCustomDetailsSelected) {
      if (value) {
        value.split(',').forEach(item => {
          if (!isSymbols(item)) {
            isValid = false;
          }
        });

        isValid
          ? $('#customDetailsValidationTip')[0].style.display = 'none'
          : $('#customDetailsValidationTip')[0].style.display = 'block';
        return isValid;
      }

      $('#customDetailsValidationTip')[0].style.display = 'block'
      return !isValid;
    }

    $('#customDetailsValidationTip')[0].style.display = 'none';
    return isValid;
  }

  function getHtmlPropertiesAndBehaviorsForToken(index = '') {
    return `<div class="paragraph">
      <div class="paragraph">
          <label>Please indicate the base type for your token.</label><br>
          <div>
            <label><input type="radio" name="baseTokenType${index}" value="true">My tokens have interchangable value (fungible)</label>
            <label><input type="radio" name="baseTokenType${index}" value="false">Every token is unique (non-fungible)</label>
          </div>
      </div>
      <div class="paragraph">
          <label>Can you create additional tokens?</label><br>
          <div>
            <label><input type="radio" name="additionalTokens${index}" value="true">Yes(Mint)</label>
            <label><input type="radio" name="additionalTokens${index}" value="false">No</label>
          </div>
      </div>
      <div class="paragraph">
          <label>Can you destroy tokens?</label><br>
          <div>
            <label><input type="radio" name="destroyTokens${index}" value="true">Yes(Burn)</label>
            <label><input type="radio" name="destroyTokens${index}" value="false">No</label>
          </div>
      </div>
      <div class="paragraph">
          <label>Can you transfer ownership of the tokens?</label><br>
          <div>
            <label><input type="radio" name="transferOwnershipTokens${index}" value="true">Yes(Transferable)</label>
            <label><input type="radio" name="transferOwnershipTokens${index}" value="false">No</label>
          </div>
      </div>
      <div class="paragraph">
          <label>Can you delegate interactions with the token to others?</label><br>
          <div>
            <label><input type="radio" class="delegateInteractions" name="delegateInteractions${index}" value="true">Yes(Delegate)</label>
            <label><input type="radio" class="delegateInteractions" name="delegateInteractions${index}" value="false">No</label>
          </div>
      </div>
    </div>`;
  }

  function isAlphaNumeric(str) {
    var exp = /^[0-9a-zA-Z]{1,255}$/g;
    return str && str.match(exp);
  }

  function isSymbols(str) {
    var exp = /^[a-zA-Z]+$/g;
    return str && str.match(exp);
  }

  function validateTokenName() {
    const value = $('#tokenName').val();
    if (!value) {
      $('#tokenNameValidationTip')[0].style.display = 'block';
      return false;
    }

    const flag = isAlphaNumeric(value);
    flag
      ? $('#tokenNameValidationTip')[0].style.display = 'none'
      : $('#tokenNameValidationTip')[0].style.display = 'block';
    return flag;
  }

  function validateTokenForm() {
    const isValidTokenName = validateTokenName();
    const isValidCustomDetails = validateCustomDetails();
    const isRequiredFieldsFilled = isAllRequiredFieldsFilled();

    return isValidTokenName && isValidCustomDetails && isRequiredFieldsFilled;
  }
}
