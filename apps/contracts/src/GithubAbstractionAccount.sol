// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {ERC4337Utils} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {AbstractSigner} from "@openzeppelin-contracts/contracts/utils/cryptography/AbstractSigner.sol";
import {ECDSA} from "@openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin-contracts/contracts/access/Ownable.sol";
import {TokenCallbackHandler} from "@account-abstraction/contracts/accounts/callback/TokenCallbackHandler.sol"; // TokenCallbackHandler enables handling of various token types.
import {Ownable} from "@openzeppelin-contracts/contracts/access/Ownable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract GithubAbstractionAccount is AbstractSigner, IAccount, Ownable, TokenCallbackHandler, UUPSUpgradeable {
    using ECDSA for bytes32;
    using ERC4337Utils for PackedUserOperation;

    error AccountUnauthorized(address sender);
    error GithubAbstractionAccount__Execution_Failed();

    modifier onlyEntryPointOrSelf() {
        _checkEntryPointOrSelf();
        _;
    }

    modifier onlyEntryPointOrFactory() {
        _checkEntryPoint();
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    function entryPoint() public pure returns (IEntryPoint) {
        return ERC4337Utils.ENTRYPOINT_V08;
    }

    /**
     * @dev Return the account nonce for the canonical sequence.
     */
    function getNonce() public view virtual returns (uint256) {
        return getNonce(0);
    }

    /**
     * @dev Return the account nonce for a given sequence (key).
     */
    function getNonce(uint192 key) public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), key);
    }

    /**
     * @inheritdoc IAccount
     */
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        public
        virtual
        onlyEntryPointOrFactory
        returns (uint256)
    {
        uint256 validationData = _validateUserOp(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
        return validationData;
    }

    /**
     * @dev Returns the validationData for a given user operation. By default, this checks the signature of the
     * signable hash (produced by {_signableUserOpHash}) using the abstract signer ({AbstractSigner-_rawSignatureValidation}).
     *
     * NOTE: The userOpHash is assumed to be correct. Calling this function with a userOpHash that does not match the
     * userOp will result in undefined behavior.
     */
    function _validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash) internal view returns (uint256) {
        return _rawSignatureValidation(_signableUserOpHash(userOp, userOpHash), userOp.signature)
            ? ERC4337Utils.SIG_VALIDATION_SUCCESS
            : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /**
     * @dev Virtual function that returns the signable hash for a user operations. Since v0.8.0 of the entrypoint,
     * `userOpHash` is an EIP-712 hash that can be signed directly.
     */
    function _signableUserOpHash(PackedUserOperation calldata, /*userOp*/ bytes32 userOpHash)
        internal
        pure
        returns (bytes32)
    {
        return userOpHash;
    }

    /**
     * @dev Sends the missing funds for executing the user operation to the {entrypoint}.
     * The `missingAccountFunds` must be defined by the entrypoint when calling {validateUserOp}.
     */
    function _payPrefund(uint256 missingAccountFunds) internal {
        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            success; // Silence warning. The entrypoint should validate the result.
        }
    }

    /**
     * @dev Ensures the caller is the {entrypoint}.
     */
    function _checkEntryPoint() internal view {
        address sender = msg.sender;
        if (sender != address(entryPoint())) {
            revert AccountUnauthorized(sender);
        }
    }

    /**
     * @dev Ensures the caller is the {entrypoint} or the account itself.
     */
    function _checkEntryPointOrSelf() internal view {
        address sender = msg.sender;
        if (sender != address(this) && sender != address(entryPoint())) {
            revert AccountUnauthorized(sender);
        }
    }

    receive() external payable virtual {}

    function _rawSignatureValidation(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        return hash.recover(signature) == owner();
    }

    function execute(address dest, uint256 value, bytes calldata func) external onlyEntryPointOrSelf {
        (bool success,) = dest.call{value: value}(func);
        if (!success) {
            revert GithubAbstractionAccount__Execution_Failed();
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyEntryPointOrSelf {}

    /*//////////////////////////////////////////////////////////////
                                 HELPER
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev This function checks the balance of the Wallet within EntryPoint
     */
    function getDeposit() public view returns (uint256 deposit) {
        return entryPoint().balanceOf(address(this));
    }
    /**
     * @dev This function adds a deposit for Wallet in EntryPoint.
     */

    function addDesposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }
}
