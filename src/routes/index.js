//Layouts
import { HeaderOnly } from '~/components/Layout'

//Pages
import Home from '~/components/pages/Home'
import Following from '~/components/pages/Following'
import Profile from '~/components/pages/Profile'
import Upload from '~/components/pages/Upload'
import Search from '~/components/pages/Search'

//Pulic routes
const publicRoutes = [
  { path: '/', component: Home },
  { path: '/following', component: Following },
  { path: '/profile', component: Profile },
  { path: '/upload', component: Upload, layout: HeaderOnly },
  { path: '/search', component: Search, layout: null },
]

const privateRoutes = []

export { publicRoutes, privateRoutes }
