// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {BaseAccount, IEntryPoint} from "@account-abstraction/contracts/core/BaseAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin-contracts/contracts/access/Ownable.sol";
import {ERC4337Utils} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {Initializable} from "@openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";
import {TokenCallbackHandler} from "@account-abstraction/contracts/accounts/callback/TokenCallbackHandler.sol"; //account should be able to handle tokens other than the native token ETH, such as ERC20s, ERC721s, ERC1155s. safe transfer need this implementation.

contract Wallet is BaseAccount, Initializable, UUPSUpgradeable, Ownable, TokenCallbackHandler {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error Wallet__NotEntryPointOrFactory();
    error Wallet__BatchExecutionFailed();

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    using ECDSA for bytes32;

    address public immutable i_walletFactory;
    IEntryPoint private immutable i_entryPoint;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event WalletInitialized(IEntryPoint indexed entryPoint, address owner);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier _requireFromEntryPointOrFactory() {
        if (msg.sender != address(i_entryPoint) || msg.sender == address(i_walletFactory)) {
            revert Wallet__NotEntryPointOrFactory();
        }
        _;
    }
    /*//////////////////////////////////////////////////////////////
                                FUNCTION
    //////////////////////////////////////////////////////////////*/

    constructor(IEntryPoint anEntryPoint, address ourWalletFactory) Ownable(ourWalletFactory) {
        i_entryPoint = anEntryPoint;
        i_walletFactory = ourWalletFactory;
    }

    receive() external payable {}
    /**
     * @dev Since the wallet remains as the implementatoin for individual proxy instance deployed via wallet factory. we need to set initializer to add the owner to each individual proxy.
     */

    function initialize(address _owner) public initializer {
        Ownable.transferOwnership(_owner);
        emit WalletInitialized(i_entryPoint, _owner);
    }

    function execute(address dest, uint256 value, bytes calldata func)
        external
        override
        _requireFromEntryPointOrFactory
    {
        _call(dest, value, func);
    }

    function executeBatch(address[] calldata dests, uint256[] calldata values, bytes[] calldata funcs)
        external
        _requireFromEntryPointOrFactory
    {
        if (dests.length != values.length) {
            revert Wallet__BatchExecutionFailed();
        }
        if (dests.length != funcs.length) {
            revert Wallet__BatchExecutionFailed();
        }
        for (uint256 i = 0; i < values.length; i++) {
            _call(dests[i], values[i], funcs[i]);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override {}
    /*//////////////////////////////////////////////////////////////
                                INTERNAL
    //////////////////////////////////////////////////////////////*/

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                // The assembly code here skips the first 32 bytes of the result, which contains the length of data.
                // It then loads the actual error message using mload and calls revert with this error message.
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _validateSignature(PackedUserOperation calldata userOp, bytes32 userOpHash)
        internal
        view
        override
        returns (uint256 validationData)
    {
        address recoveredAddress = userOpHash.recover(userOp.signature);
        validationData =
            recoveredAddress == owner() ? ERC4337Utils.SIG_VALIDATION_SUCCESS : ERC4337Utils.SIG_VALIDATION_FAILED;
    }
    /*//////////////////////////////////////////////////////////////
                                 HELPER
    //////////////////////////////////////////////////////////////*/

    function entryPoint() public view override returns (IEntryPoint) {
        return i_entryPoint;
    }
    /**
     * @dev This function encodes the signatures into a bytes array, which can be used to pass as data when making calls to the contract.
     */

    function encodeSignatures(bytes[] memory signatures) public pure returns (bytes memory) {
        return abi.encode(signatures);
    }

    /**
     * @dev This function checks the balance of the Wallet within EntryPoint.
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * @dev  This function adds a deposit for Wallet in EntryPoint.
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }
}
