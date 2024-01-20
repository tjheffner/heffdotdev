import { listContentFromIssues } from '$lib/content';

/**
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ setHeaders }) {
	const list = await listContentFromIssues('Gallery');

  // const list = [
  //     {
  //       name: 'Japan',
  //       date: 'April 2023',
  //       description: 'traveled all over the country for a month with randi',
  //       slug: '/gallery/japan',
  //       image: 'http://placekitten.com/400/400',
  //       alt: 'japan alt'
  //     },
  //     {
  //       name: 'Morocco',
  //       date: 'September 2018',
  //       description: 'visited my sister during her peace corps mission',
  //       slug: '/gallery/morocco',
  //       image: 'http://placekitten.com/400/400',
  //       alt: 'morocco alt'
  //     },
  //     {
  //       name: 'Costa Rica',
  //       date: 'December 2017',
  //       description: 'two weeks of desayuno tipica with the boys',
  //       slug: '/gallery/costa-rica',
  //       image: 'http://placekitten.com/400/400',
  //       alt: 'cr alt'
  //     },
  // ];

	setHeaders({
		'Cache-Control': `max-age=0, s-maxage=${60}` // 1 minute.. for now
	});
	return new Response(JSON.stringify(list), {
		headers: {
			'content-type': 'application/json; charset=utf-8'
		}
	});
}
