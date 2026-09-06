import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:admin,cmd:list'})
  seneca.client({type:'sqs',pin:'sys:store'})
  seneca.client({type:'sqs',pin:'sys:billing'})
  seneca.client({type:'sqs',pin:'sys:notify'})
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('admin', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
