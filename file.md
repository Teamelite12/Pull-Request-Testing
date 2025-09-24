```import { h, render } from 'preact';
// Tells babel to use h for JSX. It's better to configure this globally.
// See https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#usage
// In tsconfig you can specify this with the jsxFactory
/** @jsx h */

// create our tree and append it to document.body:
render(
	<main>
		<h1>Hello</h1>
	</main>,
	document.body
);

// update the tree in-place:
render(
	<main>
		<h1>Hello World!</h1>
	</main>,
	document.body
);
// ^ this second invocation of render(...) will use a single DOM call to update the text of the <h1>```
