import { Scroll, VisuallyHidden } from '@silk-hq/components';
import { useEffect } from 'react';
import './example-lightbox.css';
import { Lightbox } from './lightbox-core';

// ================================================================================================
// Data
// ================================================================================================

const comments = [
  {
    id: 1,
    username: 'Emma Schmidt',
    content:
      'The view is absolutely breathtaking! 🌅 The combination of the city and the sea is mesmerizing.',
  },
  {
    id: 2,
    username: 'Liam Müller',
    content: 'Amazing! 🌊',
  },
  {
    id: 3,
    username: 'Olivia Dupont',
    content:
      'The gentle waves and the vibrant city life create such a unique and calming atmosphere. I wish I was there! ✨',
  },
  {
    id: 4,
    username: 'Noah García',
    content: 'The juxtaposition of the bustling city against the serene sea is fascinating.',
  },
  {
    id: 5,
    username: 'Ava Rossi',
    content:
      'This picture makes me want to pack my bags and head straight to the coast. 🎒🌊 The city looks so inviting!',
  },
  {
    id: 6,
    username: 'Sophia Ivanova',
    content:
      'Imagine watching the sunset over this scene! The colors reflecting off the water would be stunning. I love how the city skyline meets the ocean horizon. It feels like the perfect place to explore.',
  },
  {
    id: 7,
    username: 'Mason Petrov',
    content:
      'The mix of urban architecture and natural beauty is perfect. This is now on my travel bucket list! ✈️',
  },
  {
    id: 8,
    username: 'Isabella Silva',
    content:
      'Such a vibrant and lively place. 💃🌊 The ocean adds a sense of peace to the urban energy.',
  },
  {
    id: 9,
    username: 'James Nielsen',
    content:
      "This is the kind of place where you can experience the best of both worlds - city life and seaside relaxation. 🏖️ It's the perfect destination for those who want to enjoy the excitement of the city while also having the option to unwind by the sea.",
  },
  {
    id: 10,
    username: 'Amelia Leclair',
    content: 'The sea looks so inviting!',
  },
  {
    id: 11,
    username: 'Elijah Kowalski',
    content:
      'Looking at this, I can almost hear the sound of the waves. 🎶 A perfect escape from the daily grind.',
  },
  {
    id: 12,
    username: 'Charlotte Bernard',
    content:
      'The mix of city vibes and ocean calmness is so unique. 🌊 A must-see destination for sure!',
  },
  {
    id: 13,
    username: 'Benjamin Svensson',
    content:
      "The vibrant colors and lively atmosphere in this photo make it look like a dream come true. 🎨✨ The city's vibrant colors and the ocean's calming blues create a stunning contrast that is truly mesmerizing.",
  },
  {
    id: 14,
    username: 'Mia Fernández',
    content: 'Beautiful.',
  },
  {
    id: 15,
    username: 'Henry Novak',
    content:
      'This inspires me to plan my next adventure. The city and the coast together are pure magic.',
  },
];

const [imageWidth, imageHeight] = [1600, 1200];
const imageUrl = `https://picsum.photos/${imageWidth}/${imageHeight}`;

// ================================================================================================
// Side content
// ================================================================================================

const sideContent = (
  <ul className='ExampleLightbox-sideContent'>
    {comments.map((comment: any) => (
      <li className='ExampleLightbox-comment' key={comment.id}>
        <div className='ExampleLightbox-profilePicture' />
        <div className='ExampleLightbox-text'>
          <div className='ExampleLightbox-username'>{comment.username}</div>
          <div className='ExampleLightbox-commentContent'>{comment.content}</div>
        </div>
      </li>
    ))}
  </ul>
);

// ================================================================================================
// Component
// ================================================================================================

const ExampleLightbox = () => {
  useEffect(() => {
    // Pre-load image
    const img = new Image();
    img.src = imageUrl;
  }, []);

  return (
    <Lightbox.Root>
      <Lightbox.Trigger className='ExampleLightbox-presentTrigger'>Lightbox</Lightbox.Trigger>
      <Lightbox.Portal>
        <Lightbox.View>
          <Lightbox.Backdrop />
          <Lightbox.Content>
            <img
              width={imageWidth}
              height={imageHeight}
              draggable={false}
              src={imageUrl}
              alt='Placeholder image'
            />
          </Lightbox.Content>
          <Lightbox.DismissTrigger className='ExampleLightbox-dismissTrigger'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='ExampleLightbox-dismissIcon'
            >
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
            <VisuallyHidden.Root>Dismiss Sheet</VisuallyHidden.Root>
          </Lightbox.DismissTrigger>

          {/* Large viewport side content */}

          <Lightbox.SideContent>
            <div className='ExampleLightbox-sidebarContainer'>
              <h2 className='ExampleLightbox-sidebarTitle'>Comments</h2>
              <Scroll.Root asChild>
                <Scroll.View className='ExampleLightbox-sidebarScrollView' safeArea='none'>
                  <Scroll.Content>{sideContent}</Scroll.Content>
                </Scroll.View>
              </Scroll.Root>
            </div>
          </Lightbox.SideContent>

          {/* Small viewport side sheet */}

          <Lightbox.SideSheetRoot>
            <Lightbox.SideSheetPresentTrigger className='ExampleLightbox-sideSheetPresentTrigger'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='ExampleLightbox-sideSheetPresentTriggerIcon'
              >
                <path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z' />
              </svg>
              <div className='ExampleLightbox-sideSheetPresentTriggerText'>Comments</div>
            </Lightbox.SideSheetPresentTrigger>

            <Lightbox.SideSheetPortal>
              <Lightbox.SideSheetView>
                <Lightbox.SideSheetBackdrop />
                <Lightbox.SideSheetContent className='ExampleLightbox-sideSheetContent'>
                  <div className='ExampleLightbox-sideSheetHeader'>
                    <Lightbox.SideSheetTrigger
                      className='ExampleLightbox-sideSheetDismissTrigger'
                      action='dismiss'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        className='ExampleLightbox-sideSheetDismissIcon'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </Lightbox.SideSheetTrigger>
                    <Lightbox.SideSheetTitle className='ExampleLightbox-sideSheetTitle'>
                      Comments
                    </Lightbox.SideSheetTitle>
                  </div>
                  <Lightbox.SideSheetScrollRoot asChild>
                    <Lightbox.SideSheetScrollView className='ExampleLightbox-sideSheetScrollView'>
                      <Lightbox.SideSheetScrollContent>
                        {sideContent}
                      </Lightbox.SideSheetScrollContent>
                    </Lightbox.SideSheetScrollView>
                  </Lightbox.SideSheetScrollRoot>
                </Lightbox.SideSheetContent>
              </Lightbox.SideSheetView>
            </Lightbox.SideSheetPortal>
          </Lightbox.SideSheetRoot>
        </Lightbox.View>
      </Lightbox.Portal>
    </Lightbox.Root>
  );
};

export { ExampleLightbox };
